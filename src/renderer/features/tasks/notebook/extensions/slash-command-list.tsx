import {
  ChevronRight,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Type,
  type LucideIcon,
} from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { cn } from '@renderer/utils/utils';
import type { SlashCommandIconKey, SlashCommandItem } from './slash-command';

export type SlashCommandListRef = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

const ICONS: Record<SlashCommandIconKey, LucideIcon> = {
  text: Type,
  'heading-1': Heading1,
  'heading-2': Heading2,
  'heading-3': Heading3,
  list: List,
  'list-ordered': ListOrdered,
  'list-todo': ListTodo,
  quote: Quote,
  code: Code2,
  minus: Minus,
  'chevron-right': ChevronRight,
};

export const SlashCommandList = forwardRef<
  SlashCommandListRef,
  {
    items: SlashCommandItem[];
    command: (item: SlashCommandItem) => void;
  }
>(function SlashCommandList({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((index) => (index + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((index) => (index + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const item = items[selectedIndex];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="notebook-slash-menu">
        <div className="px-3 py-2 text-sm text-foreground/50">No results</div>
      </div>
    );
  }

  return (
    <div ref={listRef} className="notebook-slash-menu">
      <div className="px-3 py-2 text-xs font-medium tracking-wide text-foreground/45 uppercase">
        Basic blocks
      </div>
      {items.map((item, index) => {
        const Icon = ICONS[item.icon];
        return (
          <button
            key={item.title}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            type="button"
            className={cn(
              'notebook-slash-item',
              index === selectedIndex && 'notebook-slash-item-active'
            )}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => command(item)}
          >
            <span className="notebook-slash-icon">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{item.title}</span>
              <span className="block truncate text-xs text-foreground/50">{item.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});
