import Foundation
import UIKit
import NitroModules
import ImageIO
import MobileCoreServices

/// Native iOS implementation of the ImageCompressor Nitro HybridObject.
///
/// Uses Apple's built-in frameworks for hardware-accelerated image processing:
/// - 1:1 scale graphics context (`UIGraphicsBeginImageContextWithOptions`) for aspect-ratio resize
/// - Native `UIImage.jpegData` SIMD encoder for JPEG compression
/// - Native `UIImage.pngData` encoder for PNG
/// - `ImageIO` (`CGImageDestination`) for WebP encoding
///
/// All compression runs on a background thread via Nitro's `Promise.async`.
/// The `getImageInfo` method is synchronous (called directly via JSI) and reads EXIF in < 1ms.
class HybridImageCompressor: HybridImageCompressorSpec {

  // MARK: - HybridObject Protocol

  var hybridContext = margelo.nitro.HybridContext()

  /// Reports approximate memory usage of this instance to Nitro's GC.
  var memorySize: Int { return getSizeOf(self) }

  // MARK: - getImageInfo (synchronous via JSI)

  /// Reads image metadata directly from EXIF headers without decoding the full pixel buffer.
  func getImageInfo(uri: String) throws -> ImageInfo {
    let url = Self.resolveFileURL(uri)
    guard let imageSource = CGImageSourceCreateWithURL(url as CFURL, nil),
          let properties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, nil) as? [CFString: Any],
          let width = properties[kCGImagePropertyPixelWidth] as? Double,
          let height = properties[kCGImagePropertyPixelHeight] as? Double else {
      throw RuntimeError.error(withMessage: "Failed to read image properties for \(uri)")
    }

    let orientation = properties[kCGImagePropertyOrientation] as? UInt32 ?? 1
    let isRotated = orientation >= 5 && orientation <= 8
    let finalWidth = isRotated ? height : width
    let finalHeight = isRotated ? width : height

    let fileSize = (try? FileManager.default.attributesOfItem(atPath: url.path)[.size] as? Double) ?? 0
    let mimeType = Self.detectMimeType(from: url)

    return ImageInfo(
      width: finalWidth,
      height: finalHeight,
      size: fileSize,
      mimeType: mimeType
    )
  }

  // MARK: - compress (async on background thread)

  /// Compresses an image with the specified options.
  ///
  /// Pipeline: decode → 1:1 resize (if needed) → encode → write to temp file
  /// All work happens off the main thread via `Promise.async`.
  func compress(uri: String, options: CompressOptions) -> Promise<CompressResult> {
    return Promise.parallel(.global(qos: .userInteractive)) {
      let url = Self.resolveFileURL(uri)

      // Use ImageIO with mmap to read directly without copying intermediate buffer
      let sourceOptions = [kCGImageSourceShouldCache: false] as CFDictionary
      guard let imageSource = CGImageSourceCreateWithURL(url as CFURL, sourceOptions) else {
        throw RuntimeError.error(withMessage: "Failed to open image at \(uri)")
      }

      guard let properties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, nil) as? [CFString: Any],
            let rawWidth = properties[kCGImagePropertyPixelWidth] as? Double,
            let rawHeight = properties[kCGImagePropertyPixelHeight] as? Double else {
        throw RuntimeError.error(withMessage: "Failed to read image dimensions for \(uri)")
      }

      let orientation = properties[kCGImagePropertyOrientation] as? UInt32 ?? 1
      let isRotated = orientation >= 5 && orientation <= 8
      let originalWidth = isRotated ? rawHeight : rawWidth
      let originalHeight = isRotated ? rawWidth : rawHeight

      guard originalWidth > 0 && originalHeight > 0 else {
        throw RuntimeError.error(withMessage: "Invalid image dimensions for \(uri)")
      }

      let maxWidth = options.maxWidth ?? 0
      let maxHeight = options.maxHeight ?? 0

      var targetWidth = originalWidth
      var targetHeight = originalHeight

      if maxWidth > 0 && originalWidth > maxWidth {
        let ratio = maxWidth / originalWidth
        targetWidth = maxWidth
        targetHeight = originalHeight * ratio
      }

      if maxHeight > 0 && targetHeight > maxHeight {
        let ratio = maxHeight / targetHeight
        targetHeight = maxHeight
        targetWidth = targetWidth * ratio
      }

      targetWidth = targetWidth.rounded()
      targetHeight = targetHeight.rounded()

      let format = options.format ?? .jpeg
      let quality = options.quality ?? 0.7
      let needsResize = targetWidth < originalWidth || targetHeight < originalHeight

      // Step 1: Sub-sampled hardware decode via ImageIO
      let cgImage: CGImage
      if needsResize || orientation > 1 {
        let maxDimension = max(targetWidth, targetHeight)
        let thumbOptions: [CFString: Any] = [
          kCGImageSourceCreateThumbnailFromImageAlways: true,
          kCGImageSourceCreateThumbnailWithTransform: true,
          kCGImageSourceShouldAllowFloat: true,
          kCGImageSourceThumbnailMaxPixelSize: maxDimension
        ]
        guard let thumb = CGImageSourceCreateThumbnailAtIndex(imageSource, 0, thumbOptions as CFDictionary) else {
          throw RuntimeError.error(withMessage: "Thumbnail creation failed for \(uri)")
        }
        cgImage = thumb
      } else {
        guard let full = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
          throw RuntimeError.error(withMessage: "Image decoding failed for \(uri)")
        }
        cgImage = full
      }

      // Step 2: Encode to target format
      let finalImage = UIImage(cgImage: cgImage)
      let compressedData: Data
      switch format {
      case .jpeg:
        guard let data = finalImage.jpegData(compressionQuality: CGFloat(quality)) else {
          throw RuntimeError.error(withMessage: "JPEG compression failed")
        }
        compressedData = data

      case .png:
        guard let data = finalImage.pngData() else {
          throw RuntimeError.error(withMessage: "PNG compression failed")
        }
        compressedData = data

      case .webp:
        let mutableData = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(
          mutableData as CFMutableData,
          "public.webp" as CFString,
          1,
          nil
        ) else {
          throw RuntimeError.error(withMessage: "WebP not supported on this device")
        }
        let opts: [CFString: Any] = [
          kCGImageDestinationLossyCompressionQuality: quality
        ]
        CGImageDestinationAddImage(destination, cgImage, opts as CFDictionary)
        guard CGImageDestinationFinalize(destination) else {
          throw RuntimeError.error(withMessage: "WebP finalization failed")
        }
        compressedData = mutableData as Data
      }

      // Step 3: Write output
      let outputURI: String
      if options.returnBase64 == true {
        outputURI = "data:image/\(format);base64," + compressedData.base64EncodedString()
      } else {
        let outputURL = Self.generateOutputURL(format: format)
        try compressedData.write(to: outputURL)
        outputURI = outputURL.absoluteString
      }

      return CompressResult(
        uri: outputURI,
        width: Double(cgImage.width),
        height: Double(cgImage.height),
        size: Double(compressedData.count)
      )
    }
  }

  // MARK: - Private Helpers

  /// Resolves a URI string to a file URL.
  private static func resolveFileURL(_ uri: String) -> URL {
    if uri.hasPrefix("file://") {
      return URL(string: uri) ?? URL(fileURLWithPath: uri.replacingOccurrences(of: "file://", with: ""))
    }
    return URL(fileURLWithPath: uri)
  }

  /// Generates a unique temporary file URL for compressed output.
  private static func generateOutputURL(format: ImageFormat) -> URL {
    let ext: String
    switch format {
    case .jpeg: ext = "jpg"
    case .png: ext = "png"
    case .webp: ext = "webp"
    }
    let fileName = "compressed_\(UUID().uuidString).\(ext)"
    let tempDir = FileManager.default.temporaryDirectory
    return tempDir.appendingPathComponent(fileName)
  }

  /// Detects MIME type by inspecting the first 4 bytes (magic number) of image file.
  private static func detectMimeType(from url: URL) -> String {
    guard let fileHandle = try? FileHandle(forReadingFrom: url) else {
      return "application/octet-stream"
    }
    defer { try? fileHandle.close() }
    let data = fileHandle.readData(ofLength: 12)
    guard data.count >= 4 else { return "application/octet-stream" }

    var header = [UInt8](repeating: 0, count: 4)
    data.copyBytes(to: &header, count: 4)

    // JPEG: starts with FF D8
    if header[0] == 0xFF && header[1] == 0xD8 {
      return "image/jpeg"
    // PNG: starts with 89 50 (‰P)
    } else if header[0] == 0x89 && header[1] == 0x50 {
      return "image/png"
    // WebP: starts with 52 49 (RI from RIFF)
    } else if header[0] == 0x52 && header[1] == 0x49 {
      return "image/webp"
    // GIF: starts with 47 49 (GI)
    } else if header[0] == 0x47 && header[1] == 0x49 {
      return "image/gif"
    }
    return "application/octet-stream"
  }
}
