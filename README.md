# Convertr - Currency Converter with Covert Mode

This is a dual-purpose mobile application built with [Expo](https://expo.dev) and React Native. It serves as a currency converter on the surface, but contains a hidden covert communications feature for individuals in domestic high-risk situations.

## Features

- **Currency Converter (Cover App)**: A fully functional currency exchange calculator with real-time conversion between 10 major currencies
- **Covert Mode**: Hidden feature activated by entering the password "123456" in the amount field
- **Cross-Platform**: Runs on iOS, Android, and Web

## Project Structure

```
convertr/
├── app/                      # Expo Router pages
│   ├── _layout.tsx          # Root layout with navigation
│   ├── index.tsx            # Currency converter home page
│   └── covert.tsx           # Covert app page
├── components/              # Shared React Native components
│   └── CurrencyConverter.tsx
├── contexts/                # React Context providers
│   └── AppStateContext.tsx
├── covert-app/              # Covert app module
│   ├── components/
│   │   └── CovertMain.tsx
│   └── README.md
└── currency-app-nextjs/     # Original Next.js prototype (reference)
```

## Get Started

1. Install dependencies

   ```bash
   bun install
   ```

2. Start the app

   ```bash
   bun start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## How to Access Covert Mode

1. Open the app - you'll see the currency converter interface
2. In the "Amount" field, enter: **123456**
3. The app will automatically navigate to the covert communications feature

## Technologies Used

- **Expo SDK 54** - Cross-platform development framework
- **React Native** - Mobile UI framework
- **Expo Router** - File-based navigation
- **React Native Picker Select** - Currency selection dropdowns
- **Firebase** - Backend services (configured but not yet implemented)
- **TypeScript** - Type-safe development

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
