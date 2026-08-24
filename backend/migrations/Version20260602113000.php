<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260602113000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Convert legacy bibliotheque status did_not_finish to termine';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("UPDATE bibliotheque SET statut = 'termine' WHERE statut = 'did_not_finish'");
    }

    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigrationException('Legacy status cleanup is irreversible.');
    }
}
