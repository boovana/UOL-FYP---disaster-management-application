# CrisisREADY
The application serves as a platform to receive near real time weather alerts, enhance prepardness and provide access to local resources such as shelters, hospitals, contacts, etc.

## Getting Started

This project uses Expo for development. To run the project, please use the following command:

```
npx expo run
```
To test the application in it's development with native features (such as the login/sign up functions.)

### Important Note

Please use `npx expo run` instead of other commands like `npx start` or `expo start`. This ensures that the project runs correctly with all necessary configurations as Firebase's User Authentication only works in a development build/native environment. To run the command `npx expo run`, you will need to set this up by configuring an AVD (Android Virtual Device), which can be done by downloading Android Studio and installing the neccessary SDK and tools. If you do not wish to go through this process, just **comment out the login and sign up pages in App.js**.

## Setting Up an Android Virtual Device (AVD) for npm expo run

To run your React Native app using `npx expo run` on an Android emulator, follow these steps:

### 1. Install Android Studio

- **Download and Install**: Get Android Studio from the [official site](https://developer.android.com/studio) and follow the installation instructions for your OS.
- **Install SDK and Tools**: Ensure you select to install the Android SDK, Android SDK Platform, and Android Virtual Device (AVD) during installation.

### 2. Configure Android Studio for AVD

1. **Open Android Studio**:
   Launch Android Studio on your machine.

2. **Configure SDK**:
   - Go to `File` > `Settings` (or `Android Studio` > `Preferences` on macOS).
   - Navigate to `Appearance & Behavior` > `System Settings` > `Android SDK`.
   - Ensure you have Android SDK 34 installed (not 35!), including `Android SDK Platform-Tools` and `Android SDK Build-Tools`.

3. **Set Up AVD**:
   - Go to `Tools` > `AVD Manager`.
   - Click on `Create Virtual Device`.
   - Choose a device model (e.g., Pixel 4).
   - Select a system image (e.g., Android 13.0). Download it if necessary.
   - Click `Next`, then `Finish` to create the AVD.

## Prerequisites

Make sure you have the following installed:
- Node.js
- npm (Node Package Manager)
- Expo CLI
- JDK 17 (set system variable and system path)

## Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```
   npm install
   ```

## Running the Project

To start the project, run:

```
npx expo run:android
```


This will start the Expo development server and provide you with options to run the app on various platforms (iOS simulator, Android emulator, or web).

## Testing Login

To test the login functionality, you can use the following credentials:

- Email: test@gmail.com
- Password: 12345678

Alternatively, you can create a new account with a valid email entirely.
