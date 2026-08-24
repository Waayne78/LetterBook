<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260810120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add signalement table, nullable user on avis/commentaire, last_login_at on utilisateur';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE signalement (id_signalement INT AUTO_INCREMENT NOT NULL, id_reporter INT NOT NULL, target_type VARCHAR(255) NOT NULL, target_id INT NOT NULL, motif LONGTEXT DEFAULT NULL, status VARCHAR(255) DEFAULT \'pending\' NOT NULL, created_at DATETIME NOT NULL, resolved_at DATETIME DEFAULT NULL, id_resolved_by INT DEFAULT NULL, INDEX IDX_SIGNALEMENT_REPORTER (id_reporter), INDEX IDX_SIGNALEMENT_RESOLVED_BY (id_resolved_by), UNIQUE INDEX UNIQ_SIGNALEMENT_REPORTER_TARGET (id_reporter, target_type, target_id), PRIMARY KEY (id_signalement)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE signalement ADD CONSTRAINT FK_SIGNALEMENT_REPORTER FOREIGN KEY (id_reporter) REFERENCES utilisateur (id_utilisateur)');
        $this->addSql('ALTER TABLE signalement ADD CONSTRAINT FK_SIGNALEMENT_RESOLVED_BY FOREIGN KEY (id_resolved_by) REFERENCES utilisateur (id_utilisateur) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE avis CHANGE id_utilisateur id_utilisateur INT DEFAULT NULL');
        $this->addSql('ALTER TABLE commentaire CHANGE id_utilisateur id_utilisateur INT DEFAULT NULL');
        $this->addSql('ALTER TABLE utilisateur ADD last_login_at DATETIME DEFAULT NULL');
        $this->addSql('CREATE TABLE refresh_tokens (id INT AUTO_INCREMENT NOT NULL, refresh_token VARCHAR(128) NOT NULL, username VARCHAR(255) NOT NULL, valid DATETIME NOT NULL, UNIQUE INDEX UNIQ_9BACE7E1C74F2195 (refresh_token), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE signalement DROP FOREIGN KEY FK_SIGNALEMENT_REPORTER');
        $this->addSql('ALTER TABLE signalement DROP FOREIGN KEY FK_SIGNALEMENT_RESOLVED_BY');
        $this->addSql('DROP TABLE signalement');
        $this->addSql('ALTER TABLE avis CHANGE id_utilisateur id_utilisateur INT NOT NULL');
        $this->addSql('ALTER TABLE commentaire CHANGE id_utilisateur id_utilisateur INT NOT NULL');
        $this->addSql('ALTER TABLE utilisateur DROP last_login_at');
        $this->addSql('DROP TABLE refresh_tokens');
    }
}
