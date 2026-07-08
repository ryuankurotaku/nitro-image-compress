import Foundation
import UIKit
import NitroModules

/// Native iOS implementation of the ImageCompressor Nitro HybridObject.
class HybridImageCompressor: HybridImageCompressorSpec {

  // MARK: - HybridObject

  var hybridContext = margelo.nitro.HybridContext()
  var memorySize: Int { return getSizeOf(self) }

  // MARK: - getImageInfo (synchronous via JSI)

  func getImageInfo(uri: String) throws -> ImageInfo {
    let url = Self.resolveFileURL(uri)
    let data = try Data(contentsOf: url)

    guard let image = UIImage(data: data) else {
      throw RuntimeError.error(withMessage: "Failed to decode image at \(uri)")
    }

    let mimeType = Self.detectMimeType(from: data)

    return ImageInfo(
      width: Double(image.size.width * image.scale),
      height: Double(image.size.height * image.scale),
      size: Double(data.count),
      mimeType: mimeType
    )
  }

  // MARK: - compress (async)

  func compress(uri: String, options: CompressOptions) -> Promise<CompressResult> {
    return Promise.async {
      let url = Self.resolveFileURL(uri)
      let data = try Data(contentsOf: url)

      guard let sourceImage = UIImage(data: data) else {
        throw RuntimeError.error(withMessage: "Failed to decode image at \(uri)")
      }

      // Calculate target dimensions
      let resizedImage = Self.resizeIfNeeded(
        image: sourceImage,
        maxWidth: options.maxWidth ?? 0,
        maxHeight: options.maxHeight ?? 0
      )

      // Compress to target format
      let quality = options.quality ?? 0.7
      let format = options.format ?? .jpeg

      let compressedData = try Self.compressImage(
        resizedImage,
        format: format,
        quality: quality
      )

      // Write output or return base64
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

  private static func resolveFileURL(_ uri: String) -> URL {
    if uri.hasPrefix("file://") {
      return URL(string: uri)!
    }
    return URL(fileURLWithPath: uri)
  }

  private static func resizeIfNeeded(
    image: UIImage,
    maxWidth: Double,
    maxHeight: Double
  ) -> UIImage {
    let originalWidth = image.size.width
    let originalHeight = image.size.height

    // No resize needed
    if maxWidth <= 0 && maxHeight <= 0 {
      return image
    }

    var targetWidth = originalWidth
    var targetHeight = originalHeight

    if maxWidth > 0 && originalWidth > CGFloat(maxWidth) {
      let ratio = CGFloat(maxWidth) / originalWidth
      targetWidth = CGFloat(maxWidth)
      targetHeight = originalHeight * ratio
    }

    if maxHeight > 0 && targetHeight > CGFloat(maxHeight) {
      let ratio = CGFloat(maxHeight) / targetHeight
      targetHeight = CGFloat(maxHeight)
      targetWidth = targetWidth * ratio
    }

    let targetSize = CGSize(width: targetWidth, height: targetHeight)
    let renderer = UIGraphicsImageRenderer(size: targetSize)

    return renderer.image { _ in
      image.draw(in: CGRect(origin: .zero, size: targetSize))
    }
  }

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
      guard let data = image.pngData() else {
        throw RuntimeError.error(withMessage: "PNG compression failed")
      }
      return data

    case .webp:
      // WebP requires ImageIO with WebP support (iOS 14+)
      guard let cgImage = image.cgImage else {
        throw RuntimeError.error(withMessage: "WebP compression failed: no CGImage")
      }
      let mutableData = NSMutableData()
      guard let destination = CGImageDestinationCreateWithData(
        mutableData as CFMutableData,
        "public.webp" as CFString,
        1,
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

  private static func generateOutputURL(format: ImageFormat) -> URL {
    let fileName = "compressed_\(UUID().uuidString).\(format)"
    let tempDir = FileManager.default.temporaryDirectory
    return tempDir.appendingPathComponent(fileName)
  }

  private static func detectMimeType(from data: Data) -> String {
    guard data.count >= 4 else { return "application/octet-stream" }

    var header = [UInt8](repeating: 0, count: 4)
    data.copyBytes(to: &header, count: 4)

    if header[0] == 0xFF && header[1] == 0xD8 {
      return "image/jpeg"
    } else if header[0] == 0x89 && header[1] == 0x50 {
      return "image/png"
    } else if header[0] == 0x52 && header[1] == 0x49 {
      return "image/webp"
    } else if header[0] == 0x47 && header[1] == 0x49 {
      return "image/gif"
    }
    return "image/unknown"
  }
}
