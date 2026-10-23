import { avatarColor } from '@/lib/utils';

interface AgentAvatarProps {
  name: string;
  type?: 'ai' | 'human';
  size?: number;
  className?: string;
}

export function AgentAvatar({ name, type = 'ai', size = 40, className = '' }: AgentAvatarProps) {
  const color = avatarColor(name);
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`relative flex items-center justify-center rounded-xl flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: `${color}22`,
        border: `1.5px solid ${color}55`,
      }}
    >
      <span
        className="display font-semibold"
        style={{ fontSize: size * 0.38, color, lineHeight: 1 }}
      >
        {initials}
      </span>
      {/* Online dot */}
      {type === 'ai' && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            background: 'var(--agent-teal)',
            borderColor: 'var(--bg)',
          }}
        />
      )}
    </div>
  );
}
