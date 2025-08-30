import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

class ShareViewController: SLComposeServiceViewController {
    
    override func isContentValid() -> Bool {
        // Do validation of contentText and/or NSExtensionContext attachments here
        return true
    }

    override func didSelectPost() {
        // This is called after the user selects Post. Do the upload of contentText and/or NSExtensionContext attachments.
        
        if let item = extensionContext?.inputItems.first as? NSExtensionItem {
            if let itemProvider = item.attachments?.first {
                handleSharedContent(itemProvider: itemProvider)
            }
        }
        
        // Inform the host that we're done, so it un-blocks its UI. Note: Alternatively you could call super's -didSelectPost, which will similarly complete the extension context.
        self.extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
    }

    override func configurationItems() -> [Any]! {
        // To add configuration options via table cells at the bottom of the sheet, return an array of SLComposeSheetConfigurationItem here.
        return []
    }
    
    private func handleSharedContent(itemProvider: NSItemProvider) {
        // Handle URL sharing
        if itemProvider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
            itemProvider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] (item, error) in
                if let url = item as? URL {
                    self?.shareURL(url)
                }
            }
        }
        // Handle text sharing (might contain URLs)
        else if itemProvider.hasItemConformingToTypeIdentifier(UTType.text.identifier) {
            itemProvider.loadItem(forTypeIdentifier: UTType.text.identifier, options: nil) { [weak self] (item, error) in
                if let text = item as? String {
                    self?.shareText(text)
                }
            }
        }
        // Handle web page sharing
        else if itemProvider.hasItemConformingToTypeIdentifier("public.url") {
            itemProvider.loadItem(forTypeIdentifier: "public.url", options: nil) { [weak self] (item, error) in
                if let url = item as? URL {
                    self?.shareURL(url)
                }
            }
        }
    }
    
    private func shareURL(_ url: URL) {
        let title = self.contentText ?? ""
        let description = self.placeholder ?? ""
        
        openMainApp(url: url.absoluteString, title: title, description: description)
    }
    
    private func shareText(_ text: String) {
        // Try to extract URL from text
        let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
        let matches = detector?.matches(in: text, options: [], range: NSRange(location: 0, length: text.utf16.count))
        
        if let match = matches?.first, let url = match.url {
            shareURL(url)
        } else {
            // If no URL found, treat the text as the URL
            openMainApp(url: text, title: self.contentText ?? "", description: "")
        }
    }
    
    private func openMainApp(url: String, title: String, description: String) {
        var components = URLComponents()
        components.scheme = "stakkit"
        components.path = "/share"
        
        var queryItems: [URLQueryItem] = []
        queryItems.append(URLQueryItem(name: "url", value: url))
        
        if !title.isEmpty {
            queryItems.append(URLQueryItem(name: "title", value: title))
        }
        
        if !description.isEmpty {
            queryItems.append(URLQueryItem(name: "description", value: description))
        }
        
        components.queryItems = queryItems
        
        if let deepLinkURL = components.url {
            DispatchQueue.main.async {
                self.extensionContext?.open(deepLinkURL, completionHandler: { success in
                    if !success {
                        print("Failed to open main app")
                    }
                })
            }
        }
    }
}
