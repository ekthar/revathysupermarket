plugins {
    id("com.android.application")
}

android {
    namespace = "in.msmsupermarket.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "in.msmsupermarket.app"
        minSdk = 23
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        manifestPlaceholders["hostName"] = "msmsupermarket.in"
        manifestPlaceholders["defaultUrl"] = "https://msmsupermarket.in/?source=twa"
        manifestPlaceholders["launcherName"] = "MSM Supermarket"
        manifestPlaceholders["assetStatements"] = """[{"relation": ["delegate_permission/common.handle_all_urls"], "target": {"namespace": "android_app", "package_name": "in.msmsupermarket.app", "sha256_cert_fingerprints": ["__SIGNING_KEY_SHA256__"]}}]"""
    }

    signingConfigs {
        create("release") {
            val keystoreFile = System.getenv("KEYSTORE_FILE")
            if (keystoreFile != null) {
                storeFile = file(keystoreFile)
                storePassword = System.getenv("KEYSTORE_PASSWORD")
                keyAlias = System.getenv("KEY_ALIAS")
                keyPassword = System.getenv("KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            val keystoreFile = System.getenv("KEYSTORE_FILE")
            if (keystoreFile != null) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")
}
