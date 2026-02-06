'use client';

// Client component importing TYPE from schema
import type { TUser } from '../schema/user.schema';

export function UserCard({ user }: { user: TUser }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
