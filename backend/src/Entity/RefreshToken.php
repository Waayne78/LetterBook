<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as Orm;
use Gesdinet\JWTRefreshTokenBundle\Entity\RefreshToken as BaseRefreshToken;

#[Orm\Entity]
#[Orm\Table(name: 'refresh_tokens')]
class RefreshToken extends BaseRefreshToken
{
}
