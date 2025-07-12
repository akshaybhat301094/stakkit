import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface LoadingCardProps {
  style?: any;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ style }) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start(() => startAnimation());
    };

    startAnimation();
  }, [shimmerAnimation]);

  const shimmerTranslateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Card Background */}
      <View style={styles.card}>
        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.iconPlaceholder} />
          <View style={styles.headerContent}>
            <View style={styles.titlePlaceholder} />
            <View style={styles.subtitlePlaceholder} />
          </View>
          <View style={styles.actionPlaceholder} />
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <View style={styles.descriptionLine1} />
          <View style={styles.descriptionLine2} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.badgePlaceholder} />
          <View style={styles.datePlaceholder} />
        </View>
      </View>

      {/* Shimmer Overlay */}
      <Animated.View
        style={[
          styles.shimmerOverlay,
          {
            transform: [{ translateX: shimmerTranslateX }],
            opacity: shimmerOpacity,
          },
        ]}
      />
    </View>
  );
};

interface CollectionLoadingSkeletonProps {
  count?: number;
}

export const CollectionLoadingSkeleton: React.FC<CollectionLoadingSkeletonProps> = ({ 
  count = 3 
}) => {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <LoadingCard 
          key={index} 
          style={[
            styles.loadingCardSpacing,
            { 
              opacity: 1 - (index * 0.1), // Subtle fade effect for multiple cards
            }
          ]} 
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
  },
  card: {
    backgroundColor: '#f1f3f4',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#e1e5e9',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  titlePlaceholder: {
    height: 16,
    backgroundColor: '#e1e5e9',
    borderRadius: 8,
    marginBottom: 6,
    width: '70%',
  },
  subtitlePlaceholder: {
    height: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    width: '45%',
  },
  actionPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e1e5e9',
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionLine1: {
    height: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    marginBottom: 6,
    width: '90%',
  },
  descriptionLine2: {
    height: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    width: '65%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgePlaceholder: {
    width: 60,
    height: 20,
    backgroundColor: '#e1e5e9',
    borderRadius: 10,
  },
  datePlaceholder: {
    width: 80,
    height: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    transform: [{ skewX: '-20deg' }],
  },
  loadingCardSpacing: {
    marginBottom: 16,
  },
});

// Link Loading Card for other screens
export const LinkLoadingCard: React.FC<LoadingCardProps> = ({ style }) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => startAnimation());
    };

    startAnimation();
  }, [shimmerAnimation]);

  const shimmerTranslateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.9, 0.4],
  });

  return (
    <View style={[linkStyles.container, style]}>
      <View style={linkStyles.card}>
        {/* Link Preview Image Placeholder */}
        <View style={linkStyles.imagePlaceholder} />
        
        {/* Link Content */}
        <View style={linkStyles.content}>
          <View style={linkStyles.titlePlaceholder} />
          <View style={linkStyles.urlPlaceholder} />
          <View style={linkStyles.descriptionPlaceholder} />
          
          {/* Platform Badge */}
          <View style={linkStyles.badgeContainer}>
            <View style={linkStyles.platformBadge} />
            <View style={linkStyles.dateBadge} />
          </View>
        </View>
      </View>

      {/* Shimmer Overlay */}
      <Animated.View
        style={[
          linkStyles.shimmerOverlay,
          {
            transform: [{ translateX: shimmerTranslateX }],
            opacity: shimmerOpacity,
          },
        ]}
      />
    </View>
  );
};

interface LinksLoadingSkeletonProps {
  count?: number;
}

export const LinksLoadingSkeleton: React.FC<LinksLoadingSkeletonProps> = ({ 
  count = 5 
}) => {
  return (
    <View style={linkStyles.skeletonContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <LinkLoadingCard 
          key={index} 
          style={[
            linkStyles.loadingCardSpacing,
            { 
              opacity: 1 - (index * 0.08), // More subtle fade for links
            }
          ]} 
        />
      ))}
    </View>
  );
};

const linkStyles = StyleSheet.create({
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e1e5e9',
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titlePlaceholder: {
    height: 14,
    backgroundColor: '#e1e5e9',
    borderRadius: 7,
    marginBottom: 6,
    width: '85%',
  },
  urlPlaceholder: {
    height: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    marginBottom: 8,
    width: '60%',
  },
  descriptionPlaceholder: {
    height: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    marginBottom: 8,
    width: '90%',
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformBadge: {
    width: 50,
    height: 16,
    backgroundColor: '#e1e5e9',
    borderRadius: 8,
  },
  dateBadge: {
    width: 70,
    height: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    transform: [{ skewX: '-15deg' }],
  },
  loadingCardSpacing: {
    marginBottom: 12,
  },
}); 