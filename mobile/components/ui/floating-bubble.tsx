import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { 
    useAnimatedStyle, 
    useSharedValue, 
    withRepeat, 
    withTiming, 
    withSequence,
    withDelay,
    Easing
} from 'react-native-reanimated';

interface FloatingBubbleProps {
    size?: number;
    color: string;
    top?: number | string;
    left?: number | string;
    right?: number | string;
    bottom?: number | string;
    opacity?: number;
    duration?: number;
    delay?: number;
    displacement?: number;
}

export const FloatingBubble = React.memo(({ 
    size = 200, 
    color, 
    top, 
    left, 
    right, 
    bottom, 
    opacity = 0.15,
    duration = 4000,
    delay = 0,
    displacement = 30
}: FloatingBubbleProps) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        translateX.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(displacement, { duration, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
                    withTiming(-displacement, { duration, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0, { duration, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                false
            )
        );

        translateY.value = withDelay(
            delay + 500,
            withRepeat(
                withSequence(
                    withTiming(-displacement, { duration: duration * 1.2, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0, { duration: duration * 1.2, easing: Easing.inOut(Easing.sin) }),
                    withTiming(displacement, { duration: duration * 1.2, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0, { duration: duration * 1.2, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                false
            )
        );

        scale.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(1.05, { duration: duration * 1.5 }),
                    withTiming(1, { duration: duration * 1.5 })
                ),
                -1,
                true
            )
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value }
            ],
        };
    });

    return (
        <Animated.View 
            style={[
                styles.bubble, 
                { 
                    width: size, 
                    height: size, 
                    borderRadius: size / 2, 
                    backgroundColor: color,
                    opacity,
                    top: top as any,
                    left: left as any,
                    right: right as any,
                    bottom: bottom as any,
                },
                animatedStyle
            ]} 
        />
    );
});

const styles = StyleSheet.create({
    bubble: {
        position: 'absolute',
        zIndex: -1,
    },
});
