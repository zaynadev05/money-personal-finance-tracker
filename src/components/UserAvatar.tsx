import React from 'react';

interface UserAvatarProps {
  avatarUrl: string | null | undefined;
  fullName: string;
  className?: string; // e.g. "w-10 h-10 border-2 border-[#D3A474]"
  textClassName?: string;
  id?: string;
}

export function isDefaultAvatar(url: any): boolean {
  if (!url || typeof url !== 'string') return true;
  return url.includes('lh3.googleusercontent.com/aida-public');
}

export default function UserAvatar({
  avatarUrl,
  fullName,
  className = 'w-10 h-10 rounded-full border-2 border-[#D3A474] shadow-xs',
  textClassName = 'text-sm font-bold text-white',
  id,
}: UserAvatarProps) {
  const isDefault = isDefaultAvatar(avatarUrl);

  const getInitial = (name: any): string => {
    if (!name || typeof name !== 'string') return 'M';
    const trimmed = name.trim();
    if (!trimmed) return 'M';
    const firstLetter = trimmed.charAt(0);
    return firstLetter ? firstLetter.toUpperCase() : 'M';
  };

  const safeAvatarUrl = typeof avatarUrl === 'string' ? avatarUrl : '';
  const safeFullName = typeof fullName === 'string' ? fullName : '';

  if (!isDefault && safeAvatarUrl) {
    return (
      <div className={`overflow-hidden rounded-full ${className}`} id={id}>
        <img
          src={safeAvatarUrl}
          alt={`${safeFullName}'s avatar`}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Draw initials styled circle matching Monify aesthetics
  const initial = getInitial(safeFullName);

  return (
    <div
      className={`rounded-full flex items-center justify-center bg-[#D3A474] text-white border-2 border-[#FAF7F2]/10 select-none ${className}`}
      id={id}
      title={safeFullName}
    >
      <span className={`font-fredoka tracking-wide leading-none ${textClassName}`}>
        {initial}
      </span>
    </div>
  );
}
