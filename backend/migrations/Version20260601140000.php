<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260601140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Drop deprecated friendship table (amis = abonnement mutuel via user_follow)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE friendship DROP FOREIGN KEY FK_FRIEND_ADDRESSEE');
        $this->addSql('ALTER TABLE friendship DROP FOREIGN KEY FK_FRIEND_REQUESTER');
        $this->addSql('DROP TABLE friendship');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE TABLE friendship (id_friendship INT AUTO_INCREMENT NOT NULL, user_low_id INT NOT NULL, user_high_id INT NOT NULL, status VARCHAR(16) NOT NULL, created_at DATETIME NOT NULL, accepted_at DATETIME DEFAULT NULL, id_requester INT NOT NULL, id_addressee INT NOT NULL, INDEX IDX_FRIEND_REQUESTER (id_requester), INDEX IDX_FRIEND_ADDRESSEE (id_addressee), UNIQUE INDEX UNIQ_FRIENDSHIP_PAIR (user_low_id, user_high_id), PRIMARY KEY (id_friendship)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE friendship ADD CONSTRAINT FK_FRIEND_REQUESTER FOREIGN KEY (id_requester) REFERENCES utilisateur (id_utilisateur) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE friendship ADD CONSTRAINT FK_FRIEND_ADDRESSEE FOREIGN KEY (id_addressee) REFERENCES utilisateur (id_utilisateur) ON DELETE CASCADE');
    }
}
