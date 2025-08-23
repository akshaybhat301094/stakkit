import { useAppSelector } from '../store/hooks';
import { getThemeColors, LightColors, DarkColors } from '../components/DesignSystem';

export const useTheme = () => {
  const { isDark } = useAppSelector((state) => state.theme);
  
  const colors = getThemeColors(isDark);
  
  return {
    isDark,
    colors,
    lightColors: LightColors,
    darkColors: DarkColors,
  };
};

export default useTheme;
