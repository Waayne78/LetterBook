<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260812100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add book metadata columns (pages, publication date, publisher, language)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE livre ADD nombre_pages INT DEFAULT NULL');
        $this->addSql('ALTER TABLE livre ADD date_publication VARCHAR(32) DEFAULT NULL');
        $this->addSql('ALTER TABLE livre ADD editeur VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE livre ADD langue VARCHAR(16) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE livre DROP nombre_pages');
        $this->addSql('ALTER TABLE livre DROP date_publication');
        $this->addSql('ALTER TABLE livre DROP editeur');
        $this->addSql('ALTER TABLE livre DROP langue');
    }
}
