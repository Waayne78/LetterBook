<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260512073751 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE avis (id_avis INT AUTO_INCREMENT NOT NULL, contenu LONGTEXT NOT NULL, note INT NOT NULL, date_publication DATETIME NOT NULL, id_utilisateur INT NOT NULL, id_livre INT NOT NULL, INDEX IDX_8F91ABF050EAE44 (id_utilisateur), INDEX IDX_8F91ABF042E60EA9 (id_livre), INDEX IDX_AVIS_DATE (date_publication), PRIMARY KEY (id_avis)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE bibliotheque (id_bibliotheque INT AUTO_INCREMENT NOT NULL, statut VARCHAR(32) NOT NULL, progression INT DEFAULT NULL, id_utilisateur INT NOT NULL, id_livre INT NOT NULL, INDEX IDX_4690D34D50EAE44 (id_utilisateur), INDEX IDX_4690D34D42E60EA9 (id_livre), UNIQUE INDEX UNIQ_BIB_USER_LIVRE (id_utilisateur, id_livre), PRIMARY KEY (id_bibliotheque)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE commentaire (id_commentaire INT AUTO_INCREMENT NOT NULL, contenu LONGTEXT NOT NULL, date_publication DATETIME NOT NULL, id_utilisateur INT NOT NULL, id_avis INT NOT NULL, INDEX IDX_67F068BC50EAE44 (id_utilisateur), INDEX IDX_67F068BC4B1B7F2 (id_avis), PRIMARY KEY (id_commentaire)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE `like` (id_like INT AUTO_INCREMENT NOT NULL, date DATETIME NOT NULL, id_utilisateur INT NOT NULL, id_avis INT NOT NULL, INDEX IDX_AC6340B350EAE44 (id_utilisateur), INDEX IDX_AC6340B34B1B7F2 (id_avis), UNIQUE INDEX UNIQ_LIKE_USER_AVIS (id_utilisateur, id_avis), PRIMARY KEY (id_like)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE livre (id_livre INT AUTO_INCREMENT NOT NULL, titre VARCHAR(255) NOT NULL, auteur VARCHAR(255) NOT NULL, resume LONGTEXT DEFAULT NULL, couverture VARCHAR(512) DEFAULT NULL, genre VARCHAR(100) DEFAULT NULL, isbn VARCHAR(32) DEFAULT NULL, external_id VARCHAR(64) DEFAULT NULL, UNIQUE INDEX UNIQ_AC634F99CC1CF4E6 (isbn), UNIQUE INDEX UNIQ_AC634F999F75D7B0 (external_id), INDEX IDX_LIVRE_TITRE (titre), INDEX IDX_LIVRE_AUTEUR (auteur), PRIMARY KEY (id_livre)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE utilisateur (id_utilisateur INT AUTO_INCREMENT NOT NULL, pseudo VARCHAR(100) NOT NULL, email VARCHAR(255) NOT NULL, mot_de_passe VARCHAR(255) NOT NULL, photo VARCHAR(255) DEFAULT NULL, bio LONGTEXT DEFAULT NULL, date_creation DATETIME NOT NULL, roles JSON NOT NULL, consentement_rgpd TINYINT DEFAULT 0 NOT NULL, consentement_rgpd_at DATETIME DEFAULT NULL, suspended TINYINT DEFAULT 0 NOT NULL, UNIQUE INDEX UNIQ_UTILISATEUR_EMAIL (email), PRIMARY KEY (id_utilisateur)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE avis ADD CONSTRAINT FK_8F91ABF050EAE44 FOREIGN KEY (id_utilisateur) REFERENCES utilisateur (id_utilisateur)');
        $this->addSql('ALTER TABLE avis ADD CONSTRAINT FK_8F91ABF042E60EA9 FOREIGN KEY (id_livre) REFERENCES livre (id_livre)');
        $this->addSql('ALTER TABLE bibliotheque ADD CONSTRAINT FK_4690D34D50EAE44 FOREIGN KEY (id_utilisateur) REFERENCES utilisateur (id_utilisateur)');
        $this->addSql('ALTER TABLE bibliotheque ADD CONSTRAINT FK_4690D34D42E60EA9 FOREIGN KEY (id_livre) REFERENCES livre (id_livre)');
        $this->addSql('ALTER TABLE commentaire ADD CONSTRAINT FK_67F068BC50EAE44 FOREIGN KEY (id_utilisateur) REFERENCES utilisateur (id_utilisateur)');
        $this->addSql('ALTER TABLE commentaire ADD CONSTRAINT FK_67F068BC4B1B7F2 FOREIGN KEY (id_avis) REFERENCES avis (id_avis)');
        $this->addSql('ALTER TABLE `like` ADD CONSTRAINT FK_AC6340B350EAE44 FOREIGN KEY (id_utilisateur) REFERENCES utilisateur (id_utilisateur)');
        $this->addSql('ALTER TABLE `like` ADD CONSTRAINT FK_AC6340B34B1B7F2 FOREIGN KEY (id_avis) REFERENCES avis (id_avis)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE avis DROP FOREIGN KEY FK_8F91ABF050EAE44');
        $this->addSql('ALTER TABLE avis DROP FOREIGN KEY FK_8F91ABF042E60EA9');
        $this->addSql('ALTER TABLE bibliotheque DROP FOREIGN KEY FK_4690D34D50EAE44');
        $this->addSql('ALTER TABLE bibliotheque DROP FOREIGN KEY FK_4690D34D42E60EA9');
        $this->addSql('ALTER TABLE commentaire DROP FOREIGN KEY FK_67F068BC50EAE44');
        $this->addSql('ALTER TABLE commentaire DROP FOREIGN KEY FK_67F068BC4B1B7F2');
        $this->addSql('ALTER TABLE `like` DROP FOREIGN KEY FK_AC6340B350EAE44');
        $this->addSql('ALTER TABLE `like` DROP FOREIGN KEY FK_AC6340B34B1B7F2');
        $this->addSql('DROP TABLE avis');
        $this->addSql('DROP TABLE bibliotheque');
        $this->addSql('DROP TABLE commentaire');
        $this->addSql('DROP TABLE `like`');
        $this->addSql('DROP TABLE livre');
        $this->addSql('DROP TABLE utilisateur');
    }
}
