# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in android/sdk/tools/proguard/proguard-android-optimize.txt

# Keep the Android Browser Helper library classes
-keep class com.google.androidbrowserhelper.** { *; }
-keep class androidx.browser.** { *; }
