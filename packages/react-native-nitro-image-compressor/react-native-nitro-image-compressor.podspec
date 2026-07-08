Pod::Spec.new do |s|
  s.name         = "NitroImageCompress"
  s.version      = "0.1.0"
  s.summary      = "High-performance on-device image compression via Nitro Modules"
  s.homepage     = "https://github.com/user/react-native-nitro-image-compressor"
  s.license      = { :type => "MIT", :file => "LICENSE" }
  s.author       = "Your Name"
  s.source       = { :git => "https://github.com/user/react-native-nitro-image-compressor.git", :tag => s.version }

  s.platforms    = { :ios => "16.0" }
  s.swift_version = "5.10"

  s.source_files = [
    "ios/**/*.{swift,h,m,mm,cpp}",
    "nitrogen/generated/ios/**/*.{swift,h,m,mm,cpp}",
    "nitrogen/generated/shared/**/*.{hpp,cpp}"
  ]

  s.dependency "NitroModules"

  install_modules_dependencies(s)
end
