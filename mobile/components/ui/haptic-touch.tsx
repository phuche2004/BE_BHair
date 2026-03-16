import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../store/useThemeStore';

interface HapticTouchProps extends TouchableOpacityProps {
    hapticStyle?: Haptics.ImpactFeedbackStyle;
    silent?: boolean;
}

/**
 * A reusable TouchableOpacity that automatically provides haptic feedback.
 * Use this instead of the standard TouchableOpacity to ensure a consistent tactile experience.
 */
export const HapticTouch = ({ 
    onPress, 
    hapticStyle, 
    silent = false,
    children, 
    ...props 
}: HapticTouchProps) => {
    const hapticsEnabled = useThemeStore((state) => state.hapticsEnabled);
    
    const handlePress = (event: any) => {
        if (!silent && hapticsEnabled) {
            if (hapticStyle) {
                Haptics.impactAsync(hapticStyle);
            } else {
                Haptics.selectionAsync();
            }
        }
        if (onPress) {
            onPress(event);
        }
    };

    return (
        <TouchableOpacity {...props} onPress={handlePress}>
            {children}
        </TouchableOpacity>
    );
};
