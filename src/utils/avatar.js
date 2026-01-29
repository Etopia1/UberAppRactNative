import { Image } from 'react-native';

// Default avatar image (User's logo)
export const DEFAULT_AVATAR_IMAGE = require('../../assets/mylogo.png');

// Get user avatar source (handles both remote URI and local default)
// Get user avatar source (handles both remote URI and fallback to Initials)
export const getAvatarSource = (user) => {
    if (user?.profilePicture || user?.avatar) {
        return { uri: user.profilePicture || user.avatar };
    }
    // Fallback: Generate Initials Avatar
    // User requested to use letter (initials) if no image.
    const name = user?.name || 'User';
    return { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=200` };
};

// Deprecated: Kept for legacy support if needed, but getAvatarSource is preferred
export const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getAvatarWithInitials = (name, size = 100) => {
    // This function returns a data URI string. 
    // We can't easily return the local asset from here as a string.
    // Ideally, components should switch to getAvatarSource.
    // For now, we'll return a placeholder or the old behavior, but we encourage switching.
    // Fallback: Initials Avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff&size=${size}`;
};
