/**
 * This file contains the color palette for the application, defining colors for both light and dark modes.
 * Centralizing colors here allows for easy theme management and consistency across the app.
 */

// Define the primary brand color.
const primaryColor = '#4285F4'; // Google Blue - a professional and versatile blue.
const secondaryColorLight = '#0a7ea4'; // A secondary blue for tints
const secondaryColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',               // Black for text
    background: '#FFFFFF',          // Pure white for backgrounds
    tint: secondaryColorLight,      // Secondary blue for tinting elements
    icon: '#687076',                // A neutral gray for general icons
    tabIconDefault: '#687076',      // Gray for inactive tab icons
    tabIconSelected: primaryColor,  // Primary blue for the active tab icon
    primary: primaryColor,          // Making the primary color easily accessible
    danger: '#D32F2F'               // A red color for delete/remove actions
  },
  dark: {
    text: '#ECEDEE',                // Off-white for text
    background: '#151718',          // Dark background
    tint: secondaryColorDark,       // White for tinting elements in dark mode
    icon: '#9BA1A6',                // A lighter gray for icons
    tabIconDefault: '#9BA1A6',      // Gray for inactive tab icons
    tabIconSelected: primaryColor,  // Primary blue for the active tab icon
    primary: primaryColor,
    danger: '#EF5350'               // A lighter red for dark mode
  },
};
