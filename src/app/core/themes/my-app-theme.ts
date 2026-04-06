import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const MyPreset = definePreset(Aura, {
  primitive: {
    red: {
      50: '#fdf2f2',
      100: '#fde2e2',
      200: '#f9bcbc',
      300: '#f28f8f',
      400: '#ea5f5f',
      500: '#d72219', // base da marca
      600: '#b81d15', // hover
      700: '#971812', // active
      800: '#76130e',
      900: '#580e0a',
      950: '#3a0907',
    },
  },

  semantic: {
    primary: {
      50: '#f2f1fb',
      100: '#e0def7',
      200: '#c2bff0',
      300: '#a39fe8',
      400: '#857fe0',
      500: '#26166f', // base da marca
      600: '#20125e', // hover
      700: '#1a0f4e', // active
      800: '#140b3d',
      900: '#0e082c',
      950: '#08051c',
    },
  },
});
