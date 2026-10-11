'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRight, Ban, ChefHat, ChevronDown, Clock, Lightbulb, PackageCheck, Recycle, ShieldCheck, ShoppingCart, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { SwapOption } from '@/lib/planner';
import { INGREDIENT_BY_ID, SLOT_LABEL } from '@/lib/data';
import { CURRENCY, cx, fmtMoney, fmtQty } from '@/lib/format';
import type { PlannedMeal } from '@/lib/types';
import { IngredientTile, RecipeIcon } from '@/components/ui/FoodTile';
import { EQUIPMENT, SLOT_ICON } from '@/components/ui/icon-map';
import { C } from '@/lib/palette';
import { sound } from '@/lib/sound';
import { easeOut, spring } from '@/components/ui/primitives';


export interface CardActions {
  /** open the full picker */
  onSwap: (meal: PlannedMeal) => void;
  getOptions: (meal: PlannedMeal) => SwapOption[];
  onPick: (meal: PlannedMeal, recipeId: string) => void;
  onBan: (meal: PlannedMeal) => void;
  onCook: (meal: PlannedMeal) => void;
  isCooked: (meal: PlannedMeal) => boolean;
}

export function RecipeCard({ meal, actions }: { meal: PlannedMeal; actions: CardActions }) {
  const [open, setOpen] = useState(false);
  const [tray, setTray] = useState(false);
  const cooked = actions.isCooked(meal);
  const quick = useMemo(() => (tray ? actions.getOptions(meal).filter((o) => !o.current && !o.sameDay) : []), [tray, actions, meal]);
  const { recipe, slot, servings } = meal;
  const m = recipe.macros;
  const macroKcal = { protein: m.protein * 4, carbs: m.carbs * 4, fat: m.fat * 9 };
  const kcalSum = macroKcal.protein + macroKcal.carbs + macroKcal.fat;
  const panelId = `recipe-${meal.day}-${slot}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      whileHover={cooked ? undefined : { y: -2 }}
      transition={spring}
      className={cx(
        'relative overflow-hidden rounded-lg border bg-surface transition-[border-color,box-shadow] duration-300',
        cooked ? 'border-mint-400 shadow-none' : 'border-line shadow-card',
      )}
    >
      <div className={cx('p-3 transition-opacity duration-300', cooked && 'opacity-60')}>
        <div className="flex flex-wrap items-center gap-1 text-xs font-bold">
          <span className="inline-flex h-3 items-center gap-1 rounded-full bg-sand px-1 text-canvas">
            {(() => { const S = SLOT_ICON[slot]; return <S size={16} />; })()}
            {SLOT_LABEL[slot]}
          </span>
          <span className="tabular inline-flex h-3 items-center gap-1 rounded-full bg-raised px-1 text-ink-soft">
            <Clock size={16} aria-hidden="true" />
            {recipe.minutes} دقيقة
          </span>
          <span className="tabular inline-flex h-3 items-center gap-1 rounded-full bg-raised px-1 text-ink-soft">
            <Users size={16} aria-hidden="true" />
            {servings} حصة
          </span>
        </div>

        <div className="mt-2 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-raised">
              <RecipeIcon id={recipe.id} size={32} />
            </span>
            <h3 className="font-display text-2xl font-bold">{recipe.title}</h3>
          </div>
          <div className="shrink-0 text-end">
            <div className="tabular font-display text-2xl font-bold text-mint-300">
              {fmtMoney(meal.costPerServing)}
              <span className="ms-1 font-sans text-xs font-bold text-ink-soft">{CURRENCY}</span>
            </div>
            <div className="text-xs text-ink-soft">للحصة الواحدة</div>
          </div>
        </div>

        {meal.usesStock.length > 0 && !cooked && (
          <p className="mt-2 flex items-center gap-1 text-xs font-medium text-mint-300" title={meal.usesStock.join('، ')}>
            <Recycle size={16} aria-hidden="true" />
            يستخدم بواقيك: {meal.usesStock.slice(0, 3).join('، ')}
            {meal.usesStock.length > 3 && ` و${meal.usesStock.length - 3} غيرها`}
          </p>
        )}

        {meal.removed.length > 0 && (
          <p className="mt-2 flex items-center gap-1 text-xs font-medium text-mint-300">
            <ShieldCheck size={16} aria-hidden="true" />
            بدون {meal.removed.join('، ')} لأجل الحساسية
          </p>
        )}

        {/* macros */}
        <div className="mt-3">
          <div className="flex h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <span className="bg-mint-500" style={{ width: `${(macroKcal.protein / kcalSum) * 100}%` }} />
            <span className="bg-sand-dim" style={{ width: `${(macroKcal.carbs / kcalSum) * 100}%` }} />
            <span className="bg-ink-faint" style={{ width: `${(macroKcal.fat / kcalSum) * 100}%` }} />
          </div>
          <dl className="mt-2 grid grid-cols-4 gap-1 text-center">
            <Macro label="سعرة" value={m.kcal} />
            <Macro label="بروتين" value={`${m.protein}غ`} dot="bg-mint-500" />
            <Macro label="كربوهيدرات" value={`${m.carbs}غ`} dot="bg-sand-dim" />
            <Macro label="دهون" value={`${m.fat}غ`} dot="bg-ink-faint" />
          </dl>
        </div>
      </div>

      <div className="px-3 pb-2">
        <CookButton cooked={cooked} onClick={() => actions.onCook(meal)} title={recipe.title} />
      </div>

      <div className="flex border-t border-line">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex h-6 min-w-0 flex-1 items-center justify-between whitespace-nowrap px-3 text-sm font-bold text-ink transition-colors hover:bg-raised"
        >
          <span className="flex items-center gap-1">
            <ChefHat size={20} aria-hidden="true" />
            {open ? 'إخفاء الطريقة' : 'طريقة التحضير'}
          </span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring}>
            <ChevronDown size={20} />
          </motion.span>
        </button>
        <button
          type="button"
          onClick={() => {
            sound.pop();
            setTray((v) => !v);
          }}
          disabled={cooked}
          aria-expanded={tray}
          aria-label={`بدّل ${recipe.title}`}
          className={cx(
            'flex h-6 shrink-0 items-center gap-1 whitespace-nowrap border-s border-line px-2 text-sm font-bold transition-colors',
            tray ? 'bg-mint/10 text-mint-300' : 'text-mint-300 hover:bg-mint/10',
            'disabled:cursor-not-allowed disabled:text-ink-faint disabled:hover:bg-transparent',
          )}
        >
          <motion.span animate={{ rotate: tray ? 180 : 0 }} transition={spring} className="flex">
            <ArrowLeftRight size={20} aria-hidden="true" />
          </motion.span>
          بدّل
        </button>
        <button
          type="button"
          disabled={cooked}
          onClick={() => {
            sound.pop();
            actions.onBan(meal);
          }}
          aria-label={`لا تقترح ${recipe.title} مجدداً`}
          title="لا تقترح هذه الأكلة مجدداً"
          className="flex h-6 w-6 shrink-0 items-center justify-center border-s border-line text-ink-faint transition-colors hover:bg-clay/15 hover:text-clay-300 disabled:cursor-not-allowed disabled:text-ink-soft disabled:hover:bg-transparent"
        >
          <Ban size={20} />
        </button>
      </div>

      {/* quick swap: the three best alternatives, ranked by what the basket already covers */}
      <AnimatePresence initial={false}>
        {tray && !cooked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 border-t border-line bg-mint/5 p-2">
              <p className="px-1 text-xs font-bold text-mint-300">بدائل سريعة</p>
              {quick.slice(0, 3).map((o, i) => (
                <motion.button
                  key={o.recipe.id}
                  type="button"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...spring, delay: 0.05 * i }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    sound.pop();
                    actions.onPick(meal, o.recipe.id);
                  }}
                  className="flex items-center gap-2 rounded-md bg-surface p-1 text-start shadow-ring transition-shadow hover:shadow-card"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-raised">
                    <RecipeIcon id={o.recipe.id} size={24} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{o.recipe.title}</span>
                    <span className="tabular block text-xs text-ink-soft">
                      {o.recipe.minutes} د · {fmtMoney(o.costPerServing)} {CURRENCY} للحصة
                    </span>
                  </span>
                  {o.needs.length === 0 ? (
                    <span className="inline-flex h-3 shrink-0 items-center gap-1 rounded-full bg-mint/15 px-1 text-xs font-bold text-mint-300">
                      <PackageCheck size={16} aria-hidden="true" />
                      من سلتك
                    </span>
                  ) : (
                    <span className="tabular inline-flex h-3 shrink-0 items-center gap-1 rounded-full bg-clay/15 px-1 text-xs font-bold text-clay-300" title={`يحتاج شراء: ${o.needs.join('، ')}`}>
                      <ShoppingCart size={16} aria-hidden="true" />+{fmtMoney(o.extra)}
                    </span>
                  )}
                </motion.button>
              ))}
              {quick.length > 3 && (
                <button type="button" onClick={() => actions.onSwap(meal)} className="self-start rounded-full px-1 text-xs font-bold text-ink-soft underline decoration-ink-faint underline-offset-4 hover:text-ink">
                  كل الخيارات ({quick.length})
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t border-line bg-raised/60 p-3">
              <div>
                <h4 className="text-xs font-bold text-sand">الأدوات</h4>
                <ul className="mt-1 flex flex-wrap gap-1">
                  {recipe.equipment.map((id) => {
                    const { name, icon } = EQUIPMENT[id];
                    return (
                      <li key={id} className="inline-flex h-4 items-center gap-1 rounded-full border border-line-strong bg-surface ps-1 pe-2 text-sm text-ink">
                        {(() => { const I = icon; return <I size={16} className="text-sand" />; })()}
                        {name}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-sand">المقادير لـ {servings} حصة</h4>
                <ul className="mt-1 flex flex-col text-sm">
                  {recipe.ingredients.map((ri) => {
                    const ing = INGREDIENT_BY_ID[ri.id];
                    const q = ri.qty * servings;
                    return (
                      <li key={ri.id} className="flex items-center justify-between gap-1 border-b border-line py-1">
                        <span className="flex items-center gap-1">
                          <IngredientTile id={ri.id} size="sm" />
                          {ing.name}
                        </span>
                        <span className="tabular text-ink-soft">{ing.unit === 'pc' ? `× ${fmtQty(q, 'pc')}` : fmtQty(q, ing.unit)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <ol className="flex flex-col gap-2">
                {recipe.steps.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="tabular flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-bold text-canvas">{i + 1}</span>
                    <p className="font-serif text-base">{s}</p>
                  </li>
                ))}
              </ol>

              <div className="flex gap-2 rounded-md border border-mint/30 bg-mint/10 p-2">
                <Lightbulb size={20} className="mt-px shrink-0 text-mint-300" aria-hidden="true" />
                <div>
                  <div className="text-xs font-bold text-mint-300">نصيحة المدرّب</div>
                  <p className="font-serif text-sm text-ink">{recipe.coachTip}</p>
                </div>
              </div>

              <p className="tabular text-xs text-ink-soft">
                تكلفة الوجبة كاملة: {fmtMoney(meal.totalCost)} {CURRENCY}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function Macro({ label, value, dot }: { label: string; value: number | string; dot?: string }) {
  return (
    <div className="flex flex-col-reverse rounded-sm bg-raised py-1">
      <dt className="flex items-center justify-center gap-1 text-xs text-ink-soft">
        {dot && <span className={cx('h-1 w-1 rounded-full', dot)} aria-hidden="true" />}
        {label}
      </dt>
      <dd className="tabular text-base font-bold">{value}</dd>
    </div>
  );
}

/** "تم الطبخ" — the most satisfying button in the app. */
function CookButton({ cooked, onClick, title }: { cooked: boolean; onClick: () => void; title: string }) {
  return (
    <motion.button
      type="button"
      onClick={() => {
        if (!cooked) sound.success();
        else sound.tick();
        onClick();
      }}
      aria-pressed={cooked}
      aria-label={cooked ? `تراجع عن طبخ ${title}` : `تم طبخ ${title}`}
      whileTap={{ scale: 0.97 }}
      className={cx(
        'relative flex h-6 w-full items-center justify-center gap-1 overflow-hidden rounded-full text-base font-bold transition-colors duration-300',
        cooked ? 'bg-mint-400 text-canvas' : 'border border-line-strong bg-surface text-ink hover:border-mint-500 hover:bg-mint/10',
      )}
    >
      {/* ripple + burst when it turns on */}
      <AnimatePresence>
        {cooked && (
          <motion.span
            key="ripple"
            className="absolute inset-0 rounded-full bg-mint-300"
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
          />
        )}
      </AnimatePresence>
      <span className="relative flex h-3 w-3 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border-2"
          initial={false}
          animate={{ borderColor: cooked ? C.canvas : C.sandDim, backgroundColor: cooked ? C.canvas : 'rgba(0,0,0,0)', scale: cooked ? [1, 1.25, 1] : 1 }}
          transition={{ duration: 0.35 }}
        />
        <svg viewBox="0 0 24 24" className="relative h-2 w-2" aria-hidden="true">
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke={C.mint300}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: cooked ? 1 : 0 }}
            transition={{ duration: 0.35, delay: cooked ? 0.12 : 0, ease: easeOut }}
          />
        </svg>
        {cooked &&
          [0, 60, 120, 180, 240, 300].map((deg) => (
            <motion.span
              key={deg}
              className="absolute h-1 w-1 rounded-full bg-sand"
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
              animate={{ x: Math.cos((deg * Math.PI) / 180) * 20, y: Math.sin((deg * Math.PI) / 180) * 20, opacity: 0, scale: 0 }}
              transition={{ duration: 0.55, ease: easeOut }}
            />
          ))}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={cooked ? 'done' : 'todo'}
          className="relative"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {cooked ? 'تم بنجاح' : 'تم الطبخ'}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
