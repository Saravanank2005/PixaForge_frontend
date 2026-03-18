const getInitial = (user) => {
  if (!user) return '?';
  const name = user.name || user.username || user.email || '';
  return name ? name.charAt(0).toUpperCase() : '?';
};

const UserAvatar = ({
  user,
  sizeClass = 'w-10 h-10',
  className = '',
  textClass = 'text-sm font-medium',
  bgClass = 'bg-primary-600 text-white'
}) => {
  const avatarUrl = user?.avatarUrl || '';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={(user?.username || user?.name || 'User') + ' avatar'}
        className={`${sizeClass} rounded-full object-cover ${className}`.trim()}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center ${textClass} ${bgClass} ${className}`.trim()}
      aria-label="User avatar"
    >
      {getInitial(user)}
    </div>
  );
};

export default UserAvatar;
