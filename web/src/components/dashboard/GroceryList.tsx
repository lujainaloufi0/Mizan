'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ClipboardCopy, Recycle, Refrigerator, Store } from 'lucide-react';
import type { InventoryRow } from '@/lib/planner';
import { useEffect, useMemo, useRef, useState } from 'react';
import { copyText, groceryText, type ListMode } from '@/lib/grocery-text';
import { AISLES } from '@/lib/data';
import { CURRENCY, cx, fmtMoney, fmtQty } from '@/lib/format';
import type { GroceryItem, Ingredient } from '@/lib/types';
import { AisleTile, IngredientTile } from '@/components/ui/FoodTile';
import { APP_ICON } from '@/components/ui/icon-map';
import { easeOut, spring } from '@/components/ui/primitives';
import { toast } from '@/components/ui/Toaster';
import { sound } from '@/lib/sound';
import { CopySheet } from './CopySheet';

export function GroceryList({
  items,
  skipped,
  checkedIds,
  onCheckedChange,
  inventory,
  covered,
  stockSaved,
  cookedCount,
  meta,
}: {
  items: GroceryItem[];
  skipped: Ingredient[];
  checkedIds: string[];
  onCheckedChange: (ids: string[]) => void;
  inventory: InventoryRow[];
  covered: { ingredient: Ingredient; qty: number }[];
  stockSaved: number;
  cookedCount: number;
  meta: { servings: number; meals: number };
}) {
  const [view, setView] = useState<'buy' | 'kitchen'>('buy');
  const [showCovered, setShowCovered] = useState(false);
  const checked = useMemo(() => new Set(checkedIds.filter((id) => items.some((i) => i.ingredient.id === id))), [checkedIds, items]);
  const [showPantry, setShowPantry] = useState(false);
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  const copy = async (mode: ListMode) => {
    // copy what's still to buy; if everything is ticked, copy the full list
    const left = items.filter((i) => !checked.has(i.ingredient.id));
    const text = groceryText(left.length ? left : items, mode, meta);
    if (await copyText(text)) {
      sound.pop();
      toast({ message: mode === 'aisle' ? 'نُسخت القائمة مرتّبة حسب الأقسام' : 'نُسخت القائمة مقسّمة حسب المتجر', icon: <Check size={20} className="text-mint-300" /> });
    } else {
      setFallbackText(text);
    }
  };

  const groups = useMemo(
    () =>
      AISLES.map((aisle) => ({
        aisle,
        items: items.filter((i) => i.ingredient.aisle === aisle.id).sort((a, b) => b.price - a.price),
      })).filter((g) => g.items.length > 0),
    [items],
  );

  const toggle = (id: string) => {
    sound.tick();
    const next = new Set(checked);
    next.has(id) ? next.delete(id) : next.add(id);
    onCheckedChange(Array.from(next));
  };

  const done = checked.size;
  const total = items.length;
  const remainingCost = items.filter((i) => !checked.has(i.ingredient.id)).reduce((s, i) => s + i.price, 0);

  return (
    <section aria-labelledby="grocery-title" className="flex flex-col rounded-lg border border-line bg-surface shadow-card">
      <header className="sticky top-0 z-[1] rounded-t-lg border-b border-line bg-surface/95 p-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <h2 id="grocery-title" className="flex items-center gap-1 whitespace-nowrap font-display text-2xl font-bold">
            <APP_ICON.cart size={28} className="text-sand" />
            قائمة المشتريات
          </h2>
          <span className="tabular text-sm font-bold text-ink-soft">
            {view === 'buy' ? `${done} / ${total}` : `طبخت ${cookedCount}`}
          </span>
        </div>

        <div role="tablist" aria-label="عرض القائمة" className="mt-2 grid grid-cols-2 gap-1 rounded-full bg-line p-1">
          {(
            [
              ['buy', 'للشراء'],
              ['kitchen', 'في مطبخي'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              onClick={() => {
                if (view !== id) sound.tick();
                setView(id);
              }}
              className={cx('relative h-4 rounded-full text-sm font-bold', view === id ? 'text-canvas' : 'text-ink')}
            >
              {view === id && <motion.span layoutId="grocery-view" transition={spring} className="absolute inset-0 rounded-full bg-sand" />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
        {view === 'buy' && (<>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
          <motion.div className="h-full rounded-full bg-mint-500" animate={{ width: `${total ? (done / total) * 100 : 0}%` }} transition={{ duration: 0.4, ease: easeOut }} />
        </div>
        <p className="tabular mt-1 text-xs text-ink-soft">
          {done === total && total > 0 ? 'اكتملت السلة — بالعافية!' : `المتبقي في السلة: ${fmtMoney(remainingCost)} ${CURRENCY}`}
        </p>
        <div className="mt-2 flex gap-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => copy('aisle')}
            className="flex h-5 flex-1 items-center justify-center gap-1 rounded-full bg-sand px-2 text-sm font-bold text-canvas transition-colors hover:bg-raised"
          >
            <ClipboardCopy size={16} aria-hidden="true" />
            انسخ المقاضي
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => copy('store')}
            aria-label="انسخ القائمة مقسّمة حسب المتجر"
            title="حسب المتجر"
            className="flex h-5 shrink-0 items-center gap-1 rounded-full border border-line-strong px-2 text-sm font-bold text-ink transition-colors hover:bg-raised"
          >
            <Store size={16} aria-hidden="true" />
            حسب المتجر
          </motion.button>
        </div>
        </>)}
        {view === 'kitchen' && (
          <p className="mt-2 text-xs text-ink-soft">مشترياتك وبواقيك، ناقص اللي طبخته. يتحدّث تلقائياً مع كل «تم الطبخ».</p>
        )}
      </header>

      {view === 'kitchen' ? (
        <KitchenView rows={inventory} />
      ) : (
      <div className="flex flex-col gap-3 p-3">
        {covered.length > 0 && (
          <div className="rounded-md bg-mint/10">
            <button
              type="button"
              onClick={() => setShowCovered((v) => !v)}
              aria-expanded={showCovered}
              className="flex w-full items-center justify-between gap-2 p-2 text-start text-sm font-bold text-mint-300"
            >
              <span className="flex items-center gap-1">
                <Recycle size={20} aria-hidden="true" />
                من بواقي الأسبوع الماضي ({covered.length}) · وفّرت {fmtMoney(stockSaved)} {CURRENCY}
              </span>
              <motion.span animate={{ rotate: showCovered ? 180 : 0 }} transition={spring}>
                <ChevronDown size={20} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {showCovered && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: easeOut }} className="overflow-hidden">
                  <div className="flex flex-wrap gap-1 px-2 pb-2">
                    {covered.map((c) => (
                      <span key={c.ingredient.id} className="flex items-center gap-1 rounded-full border border-mint/30 bg-surface py-px ps-1 pe-2 text-sm">
                        <IngredientTile id={c.ingredient.id} size="sm" className="rounded-full" />
                        {c.ingredient.name}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {groups.map(({ aisle, items: rows }) => (
          <div key={aisle.id}>
            <h3 className="mb-1 flex items-center justify-between text-xs font-bold text-sand">
              <span className="flex items-center gap-1">
                <AisleTile aisle={aisle.id} size="md" />
                {aisle.name}
              </span>
              <span className="tabular">{rows.length}</span>
            </h3>
            <ul className="flex flex-col">
              <AnimatePresence initial={false}>
                {rows.map((item) => (
                  <Row key={item.ingredient.id} item={item} checked={checked.has(item.ingredient.id)} onToggle={() => toggle(item.ingredient.id)} />
                ))}
              </AnimatePresence>
            </ul>
          </div>
        ))}

        {skipped.length > 0 && (
          <div className="rounded-md bg-raised">
            <button
              type="button"
              onClick={() => setShowPantry((v) => !v)}
              aria-expanded={showPantry}
              className="flex w-full items-center justify-between gap-2 p-2 text-start text-sm font-bold text-ink-soft"
            >
              <span className="flex items-center gap-1">
                <Refrigerator size={20} aria-hidden="true" />
                من مخزونك — ما أضفناها ({skipped.length})
              </span>
              <motion.span animate={{ rotate: showPantry ? 180 : 0 }} transition={spring}>
                <ChevronDown size={20} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {showPantry && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: easeOut }} className="overflow-hidden">
                  <div className="flex flex-wrap gap-1 px-2 pb-2">
                    {skipped.map((s) => (
                      <span key={s.id} className="rounded-full border border-line-strong bg-surface px-2 text-sm">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      )}
      <CopySheet text={fallbackText} onClose={() => setFallbackText(null)} />
    </section>
  );
}

function Row({ item, checked, onToggle }: { item: GroceryItem; checked: boolean; onToggle: () => void }) {
  const { ingredient: ing } = item;
  const deal = item.price < item.regularPrice - 0.005;
  // flash the row when a swap changes what we buy
  const prev = useRef(item.price);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (Math.abs(prev.current - item.price) > 0.001) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1200);
      prev.current = item.price;
      return () => clearTimeout(t);
    }
  }, [item.price]);
  const leftoverShare = item.leftover / (item.packs * ing.pack.size);
  // countable packs (eggs, bread) show whole pieces; single items (a lettuce) don't
  const showLeftover = leftoverShare >= 0.15 && (ing.unit !== 'pc' || (ing.pack.size > 1 && item.leftover >= 1));
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: easeOut }}
      className="overflow-hidden"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onToggle}
        className={cx(
          'group flex w-full items-center gap-2 rounded-sm px-1 py-1 text-start transition-colors duration-700 hover:bg-raised',
          flash && 'bg-mint/15 duration-150',
        )}
      >
        <span
          className={cx(
            'flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border-2 transition-colors duration-200',
            checked ? 'border-mint-500 bg-mint-500 text-canvas' : 'border-line-strong bg-surface group-hover:border-ink-faint',
          )}
        >
          <motion.span initial={false} animate={{ scale: checked ? 1 : 0 }} transition={spring}>
            <Check size={16} className="icon-bold" />
          </motion.span>
        </span>

        <IngredientTile id={ing.id} className={cx('transition-opacity duration-200', checked && 'opacity-40')} />

        <span className="min-w-0 flex-1">
          <span className={cx('relative inline-block max-w-full truncate align-top text-base font-bold transition-colors duration-200', checked && 'text-ink-faint')}>
            {ing.name}
            <motion.span
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 h-px origin-right bg-ink-faint"
              initial={false}
              animate={{ scaleX: checked ? 1 : 0 }}
              transition={{ duration: 0.25, ease: easeOut }}
            />
          </span>
          <span className="tabular block text-xs text-ink-soft">
            {item.packs} × {ing.pack.label}
            {ing.unit !== 'pc' && <span className="text-ink-faint"> · تحتاج {fmtQty(item.needed, ing.unit)}</span>}
            {item.fromStock > 0 && <span className="text-mint-300"> · {fmtQty(item.fromStock, ing.unit)} من بواقيك</span>}
            {showLeftover && <span className="text-mint-300"> · يتبقى {ing.unit === 'pc' ? `${Math.floor(item.leftover)} من ${ing.pack.size * item.packs}` : fmtQty(item.leftover, ing.unit)}</span>}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end">
          <span className={cx('tabular text-sm font-bold', checked && 'text-ink-faint')}>{fmtMoney(item.price)}</span>
          <span className={cx('text-xs', deal ? 'font-bold text-mint-300' : 'text-ink-faint')}>{item.store.name}</span>
        </span>
      </button>
    </motion.li>
  );
}

function KitchenView({ rows }: { rows: InventoryRow[] }) {
  if (!rows.length) return <p className="p-3 text-sm text-ink-soft">لا شيء في المطبخ بعد.</p>;
  return (
    <ul className="flex flex-col gap-1 p-3">
      {rows.map((r) => {
        const usedPct = r.have ? (r.used / r.have) * 100 : 0;
        const out = r.remaining <= 1e-6;
        const unitWord = r.ingredient.unit === 'pc' ? ' حبة' : '';
        return (
          <motion.li key={r.ingredient.id} layout="position" transition={spring} className="flex items-center gap-2 rounded-sm px-1 py-1">
            <IngredientTile id={r.ingredient.id} className={cx(out && 'opacity-40 grayscale')} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-1">
                <span className={cx('truncate text-base font-bold', out && 'text-ink-faint')}>{r.ingredient.name}</span>
                {out ? (
                  <span className="shrink-0 rounded-full bg-clay/15 px-1 text-xs font-bold text-clay-300">نفد</span>
                ) : (
                  <span className="tabular shrink-0 text-xs font-bold text-ink-soft">
                    {fmtQty(r.remaining, r.ingredient.unit)}
                    {unitWord}
                  </span>
                )}
              </span>
              {/* remaining (mint) shrinks from the start as meals are cooked */}
              <span className="mt-1 flex h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
                <motion.span className="h-full rounded-full bg-mint-500" initial={false} animate={{ width: `${100 - usedPct}%` }} transition={{ duration: 0.6, ease: easeOut }} />
              </span>
              <span className="tabular mt-px block text-xs text-ink-soft">
                {r.used > 0 ? `استُخدم ${fmtQty(r.used, r.ingredient.unit)}${unitWord} من ${fmtQty(r.have, r.ingredient.unit)}${unitWord}` : `لم يُستخدم بعد · ${fmtQty(r.have, r.ingredient.unit)}${unitWord}`}
              </span>
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
}
