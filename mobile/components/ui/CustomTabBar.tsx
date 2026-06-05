import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    withDelay,
    withTiming,
    interpolate
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTouch } from './haptic-touch';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MARGIN = 16;
const TAB_BAR_WIDTH = SCREEN_WIDTH - (MARGIN * 2);

const hexToRGBA = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    // Filter only visible routes based on display: 'flex' (or not 'none')
    const visibleRoutes = state.routes.filter(route => {
        const { options } = descriptors[route.key];
        const style = options.tabBarItemStyle as any;
        return style?.display !== 'none';
    });

    const totalTabs = visibleRoutes.length;
    // Calculate tab width based on available space minus horizontal padding
    const horizontalPadding = 10;
    const tabWidth = (TAB_BAR_WIDTH - (horizontalPadding * 2)) / (totalTabs || 1);

    // Calculate the index relative to visible tabs for the sliding indicator
    const currentRouteKey = state.routes[state.index].key;
    const visibleIndex = visibleRoutes.findIndex(r => r.key === currentRouteKey);

    const translateX = useSharedValue(0);

    useEffect(() => {
        if (visibleIndex !== -1) {
            translateX.value = withSpring(visibleIndex * tabWidth, {
                damping: 18,
                stiffness: 150,
                mass: 0.8,
            });
        }
    }, [visibleIndex, tabWidth]);

    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
            opacity: visibleIndex === -1 ? 0 : 1
        };
    });

    return (
        <View style={[
            styles.container,
            { bottom: Math.max(insets.bottom + 12, 24) }
        ]}>
            <View style={[
                styles.tabBar,
                {
                    backgroundColor: hexToRGBA(colors.background, 0.8),
                    borderColor: hexToRGBA(colors.border, 0.8)
                }
            ]}>
                {/* Sliding Indicator */}
                <Animated.View
                    style={[
                        styles.indicator,
                        { width: tabWidth - 4, backgroundColor: colors.secondary }, // -4 to make it slightly smaller than slot
                        indicatorStyle
                    ]}
                />

                {visibleRoutes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = visibleIndex === index;

                    return (
                        <TabItem
                            key={route.key}
                            options={options}
                            isFocused={isFocused}
                            onPress={() => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name, route.params);
                                }
                            }}
                            tabWidth={tabWidth}
                            colors={colors}
                        />
                    );
                })}
            </View>
        </View>
    );
}

const TabItem = React.memo(({ options, isFocused, onPress, tabWidth, colors }: any) => {
    const activeProgress = useSharedValue(isFocused ? 1 : 0);

    useEffect(() => {
        activeProgress.value = withTiming(isFocused ? 1 : 0, { duration: 250 });
    }, [isFocused]);

    const activeIconStyle = useAnimatedStyle(() => ({
        opacity: activeProgress.value,
        transform: [{ scale: interpolate(activeProgress.value, [0, 1], [0.8, 1]) }]
    }));

    const inactiveIconStyle = useAnimatedStyle(() => ({
        opacity: 1 - activeProgress.value,
    }));

    // Use the same icon component but handle color/opacity layers for perfect transition
    const renderIcon = (color: string) => {
        if (!options.tabBarIcon) return null;
        return options.tabBarIcon({
            focused: isFocused,
            color,
            size: 28 // Stick to 28 for consistency with layout
        });
    };

    // For Dark Mode, the indicator is light (#DEC1AC), so we need a dark icon for contrast.
    // For Light Mode, the indicator is dark (#825427), so white icon is perfect.
    const activeIconColor = colors.background === '#141210' ? '#141210' : '#FFFFFF';

    return (
        <HapticTouch
            onPress={onPress}
            style={[styles.tabItem, { width: tabWidth }]}
            activeOpacity={1}
        >
            <View style={styles.iconContainer}>
                {/* Inactive Layer */}
                <Animated.View style={[StyleSheet.absoluteFill, styles.centered, inactiveIconStyle]}>
                    {renderIcon(colors.outline)}
                </Animated.View>
                {/* Active Layer */}
                <Animated.View style={[styles.centered, activeIconStyle]}>
                    {renderIcon(activeIconColor)}
                </Animated.View>
            </View>
        </HapticTouch>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: MARGIN,
        right: MARGIN,
        alignItems: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        height: 64,
        borderRadius: 32,
        paddingHorizontal: 10,
        alignItems: 'center',
        borderWidth: 0.5,
        // Liquid Glass / Floating effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 7,
    },
    indicator: {
        position: 'absolute',
        height: 48,
        borderRadius: 24,
        left: 12, // Starting position within horizontal padding
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabItem: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
