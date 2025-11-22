import type { Profile } from '../types/profile';

interface ProfileProps {
  profile: Profile;
}

export default function Profile({ profile }: ProfileProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-red-500/50 transition-colors p-4 rounded-lg">
      <h3 className="text-white text-xl font-semibold mb-2">
        {profile.name}
      </h3>
    </div>
  );
}
