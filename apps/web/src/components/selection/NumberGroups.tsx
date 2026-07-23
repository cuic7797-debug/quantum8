import { useState, useEffect } from 'react';
import NumberBall from '@/components/common/NumberBall';
import CopyButton from '@/components/common/CopyButton';

interface Group { id: string; name: string; color: string; numbers: number[]; }
const STORAGE_KEY = 'quantum8_number_groups';
const DEFAULT_GROUPS: Group[] = [
  { id: 'hot', name: '🔥 热号组', color: '#ef4444', numbers: [] },
  { id: 'cold', name: '❄️ 冷号组', color: '#3b82f6', numbers: [] },
  { id: 'lucky', name: '🍀 幸运号', color: '#22c55e', numbers: [] },
];

export default function NumberGroups({ onSelect }: { onSelect?: (nums: number[]) => void }) {
  const [groups, setGroups] = useState<Group[]>(DEFAULT_GROUPS);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) setGroups(saved);
    } catch {}
  }, []);

  function save(groups: Group[]) {
    setGroups(groups);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  }

  function toggleNum(n: number) {
    if (!selectedGroup) return;
    save(groups.map(g => g.id === selectedGroup
      ? { ...g, numbers: g.numbers.includes(n) ? g.numbers.filter(x => x !== n) : [...g.numbers, n].sort((a, b) => a - b) }
      : g
    ));
  }

  function addGroup() {
    if (!newName.trim()) return;
    save([...groups, { id: Date.now().toString(), name: newName.trim(), color: '#8b5cf6', numbers: [] }]);
    setNewName('');
    setShowNew(false);
  }

  function deleteGroup(id: string) { save(groups.filter(g => g.id !== id)); }

  const activeGroup = groups.find(g => g.id === selectedGroup);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[var(--color-muted)]">号码分组</h4>
        <button onClick={() => setShowNew(!showNew)} className="text-[10px] text-[var(--color-primary)] hover:underline">+ 新建分组</button>
      </div>

      {showNew && (
        <div className="flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="分组名称"
            className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1 text-xs" />
          <button onClick={addGroup} className="px-3 py-1 rounded bg-[var(--color-primary)] text-white text-xs">添加</button>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {groups.map(g => (
          <button key={g.id} onClick={() => setSelectedGroup(selectedGroup === g.id ? '' : g.id)}
            className={'px-2.5 py-1 rounded-lg text-xs transition-all ' + (selectedGroup === g.id ? 'text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)]')}
            style={selectedGroup === g.id ? { backgroundColor: g.color } : {}}>
            {g.name} ({g.numbers.length})
          </button>
        ))}
      </div>

      {activeGroup && (
        <div className="bg-[var(--color-bg)] rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">{activeGroup.name}</span>
            <div className="flex gap-2">
              <CopyButton text={activeGroup.numbers.join(' ')} label="复制" />
              {groups.length > 1 && <button onClick={() => deleteGroup(activeGroup.id)} className="text-[10px] text-red-400 hover:underline">删除</button>}
            </div>
          </div>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 80 }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => toggleNum(n)}
                className={'aspect-square rounded text-[10px] font-bold transition-all ' + (activeGroup.numbers.includes(n) ? 'text-white' : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-border)]')}
                style={activeGroup.numbers.includes(n) ? { backgroundColor: activeGroup.color } : {}}>
                {n}
              </button>
            ))}
          </div>
          {onSelect && activeGroup.numbers.length > 0 && (
            <button onClick={() => onSelect(activeGroup.numbers)} className="w-full py-1.5 rounded bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs font-semibold">
              选择此分组 ({activeGroup.numbers.length}个号)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
