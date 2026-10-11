/**
 * First run: the household profile. Asked once, saved on the phone, never
 * asked again in the weekly flow (edit any time in ملفي).
 * One question per screen, one tap each, every screen skippable:
 *   goal → allergies → kitchen → always-have
 * (Dishes the family dislikes are banned from a recipe card with one tap, not asked up front.)
 */
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { AllergyPicker, AppliancePicker, GoalPicker, StaplesPicker } from '@/features/profile-pickers';
import { TopAction, Wizard } from '@/features/Wizard';
import { useMizan, type Profile } from '@/store/mizan';
import { feel } from '@/ui/feel';

export default function Welcome() {
  const saved = useMizan((s) => s.profile);
  const saveProfile = useMizan((s) => s.saveProfile);
  const hasWeek = useMizan((s) => !!s.week);
  const [p, setP] = useState<Profile>(saved);
  const [page, setPage] = useState(0);
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));

  const pages = [
    {
      title: 'وش هدفك من الأكل؟',
      subtitle: 'نختار الأطباق والحصص على هدفك، كل أسبوع.',
      body: <GoalPicker value={p.goal} onChange={(goal) => set({ goal })} />,
      empty: false,
    },
    {
      title: 'فيه أحد عنده حساسية؟',
      subtitle: 'نستبعد أي طبق فيه مسبب حساسية، في كل خطة.',
      body: <AllergyPicker value={p.allergies} onChange={(allergies) => set({ allergies })} />,
      empty: false,
    },
    {
      title: 'وش عندك في المطبخ؟',
      subtitle: 'نقترح بس الوصفات اللي تقدر تسويها.',
      body: <AppliancePicker value={p.appliances} onChange={(appliances) => set({ appliances })} />,
      empty: false,
    },
    {
      title: 'وش دايماً موجود عندك؟',
      subtitle: 'ما نضيفها للمقاضي أبداً.',
      body: <StaplesPicker value={p.staples} onChange={(staples) => set({ staples })} />,
      empty: p.staples.length === 0,
    },
  ];

  const finish = (profile: Profile) => {
    feel.success();
    saveProfile({ ...profile, setupDone: true });
    router.replace(hasWeek ? '/(tabs)' : '/new-week');
  };

  const last = page === pages.length - 1;
  const current = pages[page];

  return (
    <Wizard
      stepKey={page}
      progress={(page + 1) / pages.length}
      onBack={page > 0 ? () => setPage(page - 1) : undefined}
      aside={<TopAction label="تخطّ" onPress={() => finish({ ...p })} />}
      eyebrow={page === 0 ? 'ملفك · مرة وحدة بس' : `ملفك · ${page + 1} من ${pages.length}`}
      title={current.title}
      subtitle={current.subtitle}
      cta={{
        label: last ? (current.empty ? 'تخطّ وابدأ' : 'احفظ وابدأ') : current.empty ? 'تخطّ الآن' : 'التالي',
        icon: last ? Check : undefined,
        variant: last ? 'mint' : 'primary',
        onPress: () => {
          if (last) return finish(p);
          feel.step();
          setPage(page + 1);
        },
      }}
    >
      {current.body}
    </Wizard>
  );
}
