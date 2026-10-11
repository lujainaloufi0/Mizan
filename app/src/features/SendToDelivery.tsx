/**
 * "أرسل للتوصيل": pick a delivery app, the list is copied and the app opens,
 * ready to paste. Installed apps show their real icon (read from the phone);
 * others show a quiet monogram and open their Play Store page.
 */
import { ClipboardCopy, Send, Share2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import type { WeeklyPlan } from '@/lib/types';
import { feel } from '@/ui/feel';
import { Button, Icon, T, Tap } from '@/ui/kit';
import { Sheet, toast } from '@/ui/overlays';
import { colors, radius, space } from '@/ui/theme';
import { DELIVERY_APPS, copyList, installedIcon, sendToApp, shareList, type DeliveryApp } from './export';

export function SendListButton({ plan, checked, compact, style }: { plan: WeeklyPlan; checked: string[]; compact?: boolean; style?: object }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button label="أرسل للتوصيل" icon={Send} compact={compact} style={style} onPress={() => setOpen(true)} />
      <DeliverySheet open={open} onClose={() => setOpen(false)} plan={plan} checked={checked} />
    </>
  );
}

export function DeliverySheet({ open, onClose, plan, checked }: { open: boolean; onClose: () => void; plan: WeeklyPlan; checked: string[] }) {
  const [icons, setIcons] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!open) return;
    let alive = true;
    void Promise.all(DELIVERY_APPS.map(async (a) => [a.id, await installedIcon(a)] as const)).then((pairs) => {
      if (alive) setIcons(Object.fromEntries(pairs.filter(([, uri]) => !!uri)));
    });
    return () => {
      alive = false;
    };
  }, [open]);

  const send = async (app: DeliveryApp) => {
    feel.pop();
    onClose();
    const how = await sendToApp(app, plan, checked);
    toast({
      message: how === 'store' ? `نسخنا القائمة. ${app.name} مو مثبّت، فتحنا صفحته في المتجر` : `نسخنا القائمة. الصقها في بحث ${app.name} أو ملاحظات الطلب`,
      icon: <Icon as={ClipboardCopy} size={20} color={colors.mint300} />,
    });
  };

  return (
    <Sheet open={open} onClose={onClose} eyebrow="أرسل المقاضي" title="وين تطلب؟" subtitle="ننسخ القائمة ونفتح التطبيق، والصقها في البحث أو ملاحظات الطلب.">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(1) }}>
        {DELIVERY_APPS.map((a) => (
          <Tap
            key={a.id}
            feedback="none"
            onPress={() => void send(a)}
            accessibilityLabel={`أرسل إلى ${a.name}`}
            style={{ width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: space(2), padding: space(2), borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.raised }}
          >
            {icons[a.id] ? (
              <Image source={{ uri: icons[a.id] }} style={{ width: space(5), height: space(5), borderRadius: radius.sm }} accessibilityIgnoresInvertColors />
            ) : (
              <View style={{ width: space(5), height: space(5), borderRadius: radius.sm, backgroundColor: `${a.tint}1A`, borderWidth: 1, borderColor: `${a.tint}40`, alignItems: 'center', justifyContent: 'center' }}>
                <T v="heading" style={{ color: a.tint }}>
                  {a.name.charAt(0)}
                </T>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <T v="smallBold" numberOfLines={1}>
                {a.name}
              </T>
              <T v="caption" tone="inkSoft" numberOfLines={1}>
                {a.kind}
              </T>
            </View>
          </Tap>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: space(1) }}>
        <Button
          label="انسخ فقط"
          icon={ClipboardCopy}
          variant="outline"
          compact
          feedback="none"
          style={{ flex: 1 }}
          onPress={async () => {
            await copyList(plan, checked);
            feel.pop();
            onClose();
            toast({ message: 'نُسخت القائمة مرتّبة حسب الأقسام' });
          }}
        />
        <Button
          label="مشاركة أخرى"
          icon={Share2}
          variant="outline"
          compact
          style={{ flex: 1 }}
          onPress={() => {
            onClose();
            void shareList(plan, checked);
          }}
        />
      </View>
    </Sheet>
  );
}
