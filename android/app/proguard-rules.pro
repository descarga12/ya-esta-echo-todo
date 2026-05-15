# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number table, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Capacitor / WebView bridge
-keepattributes *Annotation*, InnerClasses, EnclosingMethod, Signature, Exceptions
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }
-keep public class * extends com.getcapacitor.plugin.CapacitorPlugin
-keepclassmembers class * extends com.getcapacitor.plugin.CapacitorPlugin {
    @com.getcapacitor.PluginMethod public *;
}
-dontwarn com.getcapacitor.**

# Plugins comunitarios (escáner, etc.)
-keep class com.capacitorcommunity.** { *; }
-keep class io.capawesome.** { *; }

# Kotlin
-dontwarn kotlin.**
-keep class kotlin.Metadata { *; }
