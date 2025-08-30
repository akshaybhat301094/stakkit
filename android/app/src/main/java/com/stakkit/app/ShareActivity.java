package com.stakkit.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import java.net.URLEncoder;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ShareActivity extends Activity {
    private static final String TAG = "ShareActivity";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Intent intent = getIntent();
        String action = intent.getAction();
        String type = intent.getType();
        
        Log.d(TAG, "ShareActivity started with action: " + action + ", type: " + type);
        
        if (Intent.ACTION_SEND.equals(action) && type != null) {
            handleSendIntent(intent);
        } else {
            Log.e(TAG, "Unknown intent received");
            finish();
        }
    }
    
    private void handleSendIntent(Intent intent) {
        String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
        String sharedSubject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        String sharedTitle = intent.getStringExtra(Intent.EXTRA_TITLE);
        
        Log.d(TAG, "Shared text: " + sharedText);
        Log.d(TAG, "Shared subject: " + sharedSubject);
        Log.d(TAG, "Shared title: " + sharedTitle);
        
        if (sharedText != null) {
            String url = extractUrlFromText(sharedText);
            String title = extractTitleFromSharedData(sharedTitle, sharedSubject, sharedText);
            String description = extractDescriptionFromSharedData(sharedText, sharedSubject);
            
            Log.d(TAG, "Extracted URL: " + url);
            Log.d(TAG, "Extracted title: " + title);
            Log.d(TAG, "Extracted description: " + description);
            
            openMainApp(url, title, description);
        } else {
            Log.e(TAG, "No shared text found");
            finish();
        }
    }
    
    private String extractUrlFromText(String text) {
        // First, check if the entire text is a URL
        if (isValidUrl(text.trim())) {
            return text.trim();
        }
        
        // If not, try to find URLs within the text
        Pattern urlPattern = Pattern.compile(
            "https?://[\\w\\.-]+(?:\\.[a-zA-Z]{2,})+(?:[/?#][^\\s]*)?",
            Pattern.CASE_INSENSITIVE
        );
        
        Matcher matcher = urlPattern.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        
        // If no HTTP URL found, look for other URL schemes
        Pattern genericUrlPattern = Pattern.compile(
            "\\b[a-zA-Z][a-zA-Z0-9+.-]*://[^\\s]+",
            Pattern.CASE_INSENSITIVE
        );
        
        matcher = genericUrlPattern.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        
        // If still no URL found, return the original text (might be a URL without protocol)
        return text.trim();
    }
    
    private boolean isValidUrl(String url) {
        try {
            Uri uri = Uri.parse(url);
            return uri.getScheme() != null && (
                uri.getScheme().equals("http") || 
                uri.getScheme().equals("https") ||
                uri.getScheme().equals("ftp")
            );
        } catch (Exception e) {
            return false;
        }
    }
    
    private String extractTitleFromSharedData(String title, String subject, String text) {
        // Priority: title > subject > first line of text
        if (title != null && !title.trim().isEmpty()) {
            return title.trim();
        }
        
        if (subject != null && !subject.trim().isEmpty()) {
            return subject.trim();
        }
        
        // Extract first line from text (excluding URL)
        if (text != null) {
            String[] lines = text.split("\\n");
            for (String line : lines) {
                String trimmed = line.trim();
                if (!trimmed.isEmpty() && !isValidUrl(trimmed)) {
                    return trimmed;
                }
            }
        }
        
        return "";
    }
    
    private String extractDescriptionFromSharedData(String text, String subject) {
        // Use subject as description if we have text as title
        if (subject != null && !subject.trim().isEmpty()) {
            return subject.trim();
        }
        
        // Extract description from text (skip URL and title lines)
        if (text != null) {
            String[] lines = text.split("\\n");
            StringBuilder description = new StringBuilder();
            
            for (String line : lines) {
                String trimmed = line.trim();
                if (!trimmed.isEmpty() && !isValidUrl(trimmed)) {
                    if (description.length() > 0) {
                        description.append(" ");
                    }
                    description.append(trimmed);
                }
            }
            
            return description.toString();
        }
        
        return "";
    }
    
    private void openMainApp(String url, String title, String description) {
        try {
            StringBuilder deepLinkBuilder = new StringBuilder("stakkit://share");
            
            // Add URL parameter
            deepLinkBuilder.append("?url=").append(URLEncoder.encode(url, "UTF-8"));
            
            // Add title if available
            if (title != null && !title.isEmpty()) {
                deepLinkBuilder.append("&title=").append(URLEncoder.encode(title, "UTF-8"));
            }
            
            // Add description if available
            if (description != null && !description.isEmpty()) {
                deepLinkBuilder.append("&description=").append(URLEncoder.encode(description, "UTF-8"));
            }
            
            String deepLink = deepLinkBuilder.toString();
            Log.d(TAG, "Opening deep link: " + deepLink);
            
            Intent deepLinkIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(deepLink));
            deepLinkIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            
            // Try to open the main app
            try {
                startActivity(deepLinkIntent);
                Log.d(TAG, "Successfully opened main app");
            } catch (Exception e) {
                Log.e(TAG, "Failed to open main app, trying to launch main activity", e);
                
                // Fallback: open main activity with extras
                Intent fallbackIntent = new Intent(this, MainActivity.class);
                fallbackIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                fallbackIntent.putExtra("shareUrl", url);
                fallbackIntent.putExtra("shareTitle", title);
                fallbackIntent.putExtra("shareDescription", description);
                
                startActivity(fallbackIntent);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error opening main app", e);
        } finally {
            finish();
        }
    }
}
