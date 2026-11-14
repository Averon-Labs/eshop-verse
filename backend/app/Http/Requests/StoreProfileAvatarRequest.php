<?php

namespace App\Http\Requests;

use App\Services\ProfileImageStorage;

/**
 * docs/openapi.yaml ProfileAvatarInput — multipart body of
 * POST /auth/profile/avatar.
 *
 * The file is validated on its detected content type (`mimes:`), not on the
 * client-supplied name, so a renamed executable is rejected. The dimensions
 * cap rejects decompression bombs, and the size follows the contract's 5 MB
 * ceiling.
 */
class StoreProfileAvatarRequest extends ApiFormRequest
{
    /**
     * @return array<int, string>
     */
    protected function allowedFields(): array
    {
        return ['image'];
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'image' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp',
                'max:'.ProfileImageStorage::MAX_KILOBYTES,
                'dimensions:max_width=4096,max_height=4096',
            ],
        ];
    }
}
