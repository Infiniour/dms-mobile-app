import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Grid, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { listShowrooms } from '@/services';
import { resolvePrimaryShowroomId } from '@/utils/showroom';
import { BackButton, Button, SkeletonBox } from '@/components/ui';

type ShowroomItem = {
  id: number;
  showroom_id: string;
  name: string;
  role: string;
};

export function ShowroomListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [showrooms, setShowrooms] = useState<ShowroomItem[]>([]);
  const [primaryShowroomId, setPrimaryShowroomId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;

  useEffect(() => {
    const loadShowrooms = async () => {
      try {
        const primaryId = await resolvePrimaryShowroomId();
        if (primaryId) {
          setPrimaryShowroomId(primaryId);
        }

        const response = await listShowrooms();
        const data = (response as unknown as { data?: { showrooms?: ShowroomItem[] } })?.data;
        setShowrooms(data?.showrooms ?? []);
      } catch (err) {
        Alert.alert('Error', 'Failed to load showrooms');
      } finally {
        setIsLoading(false);
      }
    };

    loadShowrooms();
  }, []);

  const handleShowroomPress = (showroomId: number) => {
    router.push({
      pathname: '/showroom/details',
      params: { id: showroomId.toString() },
    });
  };

  const handleCreateShowroom = () => {
    router.push('/showroom/create');
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}>
        <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
          <BackButton />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
          showsVerticalScrollIndicator={false}>
          <View style={{ gap: 12 }}>
            {Array(4)
              .fill(null)
              .map((_, index) => (
                <SkeletonBox key={index} width="100%" height={64} borderRadius={12} />
              ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <BackButton />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}>
        <Text style={[Typography.hero2, styles.title, { color: colors['on-surface'] }]}>
          My Showrooms
        </Text>
        <Text style={[Typography.body, styles.subtitle, { color: colors['on-surface-variant'] }]}>
          Manage your dealership locations
        </Text>

        {/* Showroom List */}
        {showrooms.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors['surface-container-high'] }]}>
              <Ionicons name="storefront-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors['on-surface'] }]}>
              No Showrooms Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors['on-surface-variant'] }]}>
              Create your first showroom to get started
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {showrooms.map((showroom) => (
              <ShowroomRow
                key={showroom.id}
                showroom={showroom}
                isActive={showroom.id === primaryShowroomId}
                onPress={() => handleShowroomPress(showroom.id)}
                colors={colors}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingHorizontal: horizontalPadding }]}>
        <Button label="Add Showroom" onPress={handleCreateShowroom} />
      </View>
    </SafeAreaView>
  );
}

function ShowroomRow({
  showroom,
  isActive,
  onPress,
  colors,
}: {
  showroom: ShowroomItem;
  isActive: boolean;
  onPress: () => void;
  colors: ReturnType<import('@/hooks/useTheme').useTheme>['colors'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          opacity: pressed ? 0.6 : 1,
          borderBottomColor: colors.outline,
        },
      ]}>
      <View style={[styles.rowIcon, { backgroundColor: isActive ? colors.primary : colors['surface-container-high'] }]}>
        <Ionicons
          name="storefront"
          size={20}
          color={isActive ? colors['on-primary'] : colors.primary}
        />
      </View>

      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: colors['on-surface'] }]} numberOfLines={1}>
          {showroom.name}
        </Text>
        <Text style={[styles.rowSubtitle, { color: colors['on-surface-variant'] }]}>
          {showroom.showroom_id} • {showroom.role?.charAt(0).toUpperCase() + showroom.role?.slice(1)}
        </Text>
      </View>

      <View style={styles.rowRight}>
        {isActive && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors['on-primary'] }]}>Active</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors['on-surface-variant']} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 20,
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  list: {
    gap: 0,
  },
  row: {
    minHeight: 64,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 12,
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minHeight: 300,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  emptySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
});
