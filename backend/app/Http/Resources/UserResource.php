<?php

namespace App\Http\Resources;

use App\Services\ProfileImageStorage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * docs/openapi.yaml User schema: id, email, firstName, lastName, role,
 * status, createdAt, avatarUrl. Hidden internals (password, tokens) never
 * appear.
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'firstName' => $this->first_name,
            'lastName' => $this->last_name,
            'role' => $this->role,
            'status' => $this->status,
            'createdAt' => $this->created_at?->toIso8601String(),
            // PRF-001: always present, null when the customer has no photo.
            'avatarUrl' => app(ProfileImageStorage::class)->urlFor($this->avatar_path),
        ];
    }
}
