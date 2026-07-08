import Foundation
import UIKit
import NitroModules

/// Native iOS implementation of the ImageCompressor Nitro HybridObject.
///
/// Uses Apple's built-in frameworks for hardware-accelerated image processing:
/// - `UIImage` + `UIGraphicsImageRenderer` for resize operations
/// - `ImageIO` (`CGImageDestination`) for WebP/HEIF encoding
/// - Native JPEG/PNG encoders for standard formats
///
/// All compression runs on a background thread via Nitro's `Promise.async`.
/// The `getImageInfo` method is synchronous (called directly via JSI).
class HybridImageCompressor: HybridImageCompressorSpec {

  // MARK: - HybridObject Protocol

  var hybridContext = margelo.nitro.HybridContext()

  /// Reports approximate memory usage of this instance to Nitro's GC.
  var memorySize: Int { return getSizeOf(self) }

  // MARK: - getImageInfo (synchronous via JSI)

  /// Reads image metadata without decoding the full pixel buffer.
  /// Uses `UIImage` which respects EXIF orientation for correct width/height.
  ///
  /// - Parameter uri: File URI or absolute path to the image
  /// - Returns: `ImageInfo` with dimensions, byte size, and detected MIME type
  /// - Throws: If the file cannot be read or decoded
  func getImageInfo(uri: String) throws -> ImageInfo {
    let url = Self.resolveFileURL(uri)
    let data = try Data(contentsOf: url)

    guard let image = UIImage(data: data) else {
      throw RuntimeError.error(withMessage: "Failed to decode image at \(uri)")
    }

    let mimeType = Self.detectMimeType(from: data)

    // Multiply by scale to get actual pixel dimensions (e.g., @2x, @3x images)
    return ImageInfo(
      width: Double(image.size.width * image.scale),
      height: Double(image.size.height * image.scale),
      size: Double(data.count),
      mimeType: mimeType
    )
  }

  // MARK: - compress (async on background thread)

  /// Compresses an image with the specified options.
  ///
  /// Pipeline: decode → resize (if needed) → encode → write to temp file
  /// All work happens off the main thread via `Promise.async`.
  ///
  /// - Parameters:
  ///   - uri: File URI or absolute path to the source image
  ///   - options: Compression configuration (quality, dimensions, format, output type)
  /// - Returns: `CompressResult` with output URI, final dimensions, and byte size
  func compress(uri: String, options: CompressOptions) -> Promise<CompressResult> {
    return Promise.async {
      let url = Self.resolveFileURL(uri)
      let data = try Data(contentsOf: url)

      guard let sourceImage = UIImage(data: data) else {
        throw RuntimeError.error(withMessage: "Failed to decode image at \(uri)")
      }

      // Step 1: Resize if constraints are specified
      let resizedImage = Self.resizeIfNeeded(
        image: sourceImage,
        maxWidth: options.maxWidth ?? 0,
        maxHeight: options.maxHeight ?? 0
      )

      // Step 2: Encode to target format
      let quality = options.quality ?? 0.7
      let format = options.format ?? .jpeg

      let compressedData = try Self.compressImage(
        resizedImage,
        format: format,
        quality: quality
      )

      // Step 3: Write output (file URI or base64 data URI)
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
        width: Double(resizedImage.size.width * resizedImage.scale),
        height: Double(resizedImage.size.height * resizedImage.scale),
        size: Double(compressedData.count)
      )
    }
  }

  // MARK: - Private Helpers

  /// Resolves a URI string to a file URL.
  /// Handles both `file://` prefixed URIs and bare absolute paths.
  private static func resolveFileURL(_ uri: String) -> URL {
    if uri.hasPrefix("file://") {
      return URL(string: uri)!
    }
    return URL(fileURLWithPath: uri)
  }

  /// Resizes an image if it exceeds the given max dimensions.
  /// Maintains aspect ratio — the tighter constraint wins.
  /// Returns the original image unchanged if no resize is needed.
  ///
  /// - Parameters:
  ///   - image: Source UIImage
  ///   - maxWidth: Maximum allowed width (0 = no constraint)
  ///   - maxHeight: Maximum allowed height (0 = no constraint)
  /// - Returns: Resized image, or original if within bounds
  private static func resizeIfNeeded(
    image: UIImage,
    maxWidth: Double,
    maxHeight: Double
  ) -> UIImage {
    let originalWidth = image.size.width
    let originalHeight = image.size.height

    // No resize needed if no constraints specified
    if maxWidth <= 0 && maxHeight <= 0 {
      return image
    }

    var targetWidth = originalWidth
    var targetHeight = originalHeight

    // Scale down by width first
    if maxWidth > 0 && originalWidth > CGFloat(maxWidth) {
      let ratio = CGFloat(maxWidth) / originalWidth
      targetWidth = CGFloat(maxWidth)
      targetHeight = originalHeight * ratio
    }

    // Then further constrain by height if still too tall
    if maxHeight > 0 && targetHeight > CGFloat(maxHeight) {
      let ratio = CGFloat(maxHeight) / targetHeight
      targetHeight = CGFloat(maxHeight)
      targetWidth = targetWidth * ratio
    }

    let targetSize = CGSize(width: targetWidth, height: targetHeight)

    // UIGraphicsImageRenderer is hardware-accelerated and handles color space correctly
    let renderer = UIGraphicsImageRenderer(size: targetSize)
    return renderer.image { _ in
      image.draw(in: CGRect(origin: .zero, size: targetSize))
    }
  }

  /// Encodes a UIImage to the specified format and quality.
  ///
  /// - Parameters:
  ///   - image: The image to encode
  ///   - format: Target format (jpeg, png, webp)
  ///   - quality: Compression quality 0.0–1.0 (ignored for PNG)
  /// - Returns: Encoded image data
  /// - Throws: If encoding fails (e.g., WebP not supported on older devices)
  private static func compressImage(
    _ image: UIImage,
    format: ImageFormat,
    quality: Double
  ) throws -> Data {
    switch format {
    case .jpeg:
      guard let data = image.jpegData(compressionQuality: CGFloat(quality)) else {
        throw RuntimeError.error(withMessage: "JPEG compression failed")
      }
      return data

    case .png:
      // PNG is lossless — quality parameter is ignored
      guard let data = image.pngData() else {
        throw RuntimeError.error(withMessage: "PNG compression failed")
      }
      return data

    case .webp:
      // WebP encoding via ImageIO (available iOS 14+)
      guard let cgImage = image.cgImage else {
        throw RuntimeError.error(withMessage: "WebP compression failed: no CGImage")
      }
      let mutableData = NSMutableData()
      guard let destination = CGImageDestinationCreateWithData(
        mutableData as CFMutableData,
        "public.webp" as CFString,
        1,    // image count
        nil
      ) else {
        throw RuntimeError.error(withMessage: "WebP not supported on this device")
      }
      let options: [CFString: Any] = [
        kCGImageDestinationLossyCompressionQuality: quality
      ]
      CGImageDestinationAddImage(destination, cgImage, options as CFDictionary)
      guard CGImageDestinationFinalize(destination) else {
        throw RuntimeError.error(withMessage: "WebP finalization failed")
      }
      return mutableData as Data
    }
  }

  /// Generates a unique temporary file URL for compressed output.
  /// Files are stored in the system temp directory and auto-cleaned by the OS.
  private static func generateOutputURL(format: ImageFormat) -> URL {
    let fileName = "compressed_\(UUID().uuidString).\(format)"
    let tempDir = FileManager.default.temporaryDirectory
    return tempDir.appendingPathComponent(fileName)
  }

  /// Detects MIME type by inspecting the first 4 bytes (magic number) of image data.
  /// More reliable than file extension since users may rename files.
  private static func detectMimeType(from data: Data) -> String {
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
    return "image/unknown"
  }
}
