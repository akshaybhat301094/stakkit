package com.stakkit.app;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

public class MainActivity extends ReactActivity {
  private static final String TAG = "MainActivity";
  
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "stakkit";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    handleIntent(getIntent());
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    handleIntent(intent);
  }

  private void handleIntent(Intent intent) {
    if (intent == null) return;
    
    // Handle share intents from ShareActivity
    String shareUrl = intent.getStringExtra("shareUrl");
    String shareTitle = intent.getStringExtra("shareTitle");
    String shareDescription = intent.getStringExtra("shareDescription");
    
    if (shareUrl != null) {
      Log.d(TAG, "Received share intent with URL: " + shareUrl);
      
      // Create deep link intent to navigate to ShareLink screen
      Intent deepLinkIntent = new Intent(Intent.ACTION_VIEW);
      StringBuilder deepLinkBuilder = new StringBuilder("stakkit://share");
      
      try {
        deepLinkBuilder.append("?url=").append(java.net.URLEncoder.encode(shareUrl, "UTF-8"));
        
        if (shareTitle != null && !shareTitle.isEmpty()) {
          deepLinkBuilder.append("&title=").append(java.net.URLEncoder.encode(shareTitle, "UTF-8"));
        }
        
        if (shareDescription != null && !shareDescription.isEmpty()) {
          deepLinkBuilder.append("&description=").append(java.net.URLEncoder.encode(shareDescription, "UTF-8"));
        }
        
        deepLinkIntent.setData(android.net.Uri.parse(deepLinkBuilder.toString()));
        
        // Send to React Native
        onNewIntent(deepLinkIntent);
        
      } catch (Exception e) {
        Log.e(TAG, "Error encoding share parameters", e);
      }
    }
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        DefaultNewArchitectureEntryPoint.getFabricEnabled(), // fabricEnabled
        // If you opted-in for the New Architecture, we enable Concurrent React (i.e. React 18).
        DefaultNewArchitectureEntryPoint.getConcurrentReactEnabled() // concurrentRootEnabled
        );
  }
}
