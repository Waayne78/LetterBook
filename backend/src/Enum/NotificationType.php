<?php

declare(strict_types=1);

namespace App\Enum;

enum NotificationType: string
{
    /** @deprecated Anciennes demandes d’ami — conservé pour lecture des lignes existantes */
    case FRIEND_REQUEST = 'friend_request';
    /** @deprecated Anciennes acceptations — conservé pour lecture des lignes existantes */
    case FRIEND_ACCEPTED = 'friend_accepted';
    case FRIEND_MUTUAL = 'friend_mutual';
    case NEW_FOLLOWER = 'new_follower';
}
