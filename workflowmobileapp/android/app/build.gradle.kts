import java.io.File

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Newland URM-500: real bridge when android/app/libs/*.aar or *.jar exists (unless rfid.forceStub=true in gradle.properties).
val forceRfidStub: Boolean =
    (providers.gradleProperty("rfid.forceStub").orNull ?: "")
        .equals("true", ignoreCase = true)

val newlandRfidSdkPresent: Boolean =
    !forceRfidStub &&
        File(project.projectDir, "libs").listFiles()?.any { 
            it.name.endsWith(".aar", ignoreCase = true) || it.name.endsWith(".jar", ignoreCase = true)
        } == true

android {
    namespace = "com.example.rfid_product_manager"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.example.rfid_product_manager"
        // NLS-MT95L and UHF stack; keep at least 21 for older handhelds.
        minSdk = maxOf(21, flutter.minSdkVersion)
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    sourceSets.named("main") {
        kotlin.srcDir(
            if (newlandRfidSdkPresent) "src/rfid-sdk/kotlin" else "src/rfid-stub/kotlin",
        )
        if (newlandRfidSdkPresent) {
            jniLibs.srcDirs("libs")
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    if (newlandRfidSdkPresent) {
        implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.aar", "*.jar"))))
    }
}
