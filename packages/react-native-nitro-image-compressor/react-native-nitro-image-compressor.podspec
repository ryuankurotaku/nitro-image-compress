require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NitroImageCompress"
  s.version      = package["version"]
  s.summary      = package["description"] || "High-performance on-device image compression via Nitro Modules"
  s.homepage     = "https://github.com/user/react-native-nitro-image-compressor"
  s.license      = { :type => "MIT", :file => "LICENSE" }
  s.authors      = package["author"] || "Your Name"
  s.source       = { :git => "https://github.com/user/react-native-nitro-image-compressor.git", :tag => s.version }

  s.platforms    = { :ios => "16.0" }
  s.swift_version = "5.10"

  s.source_files = [
    "ios/**/*.{swift,h,m,mm,cpp}",
  ]

  load 'nitrogen/generated/ios/NitroImageCompress+autolinking.rb'
  add_nitrogen_files(s)

  install_modules_dependencies(s)
end
