<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260601120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Social: user_follow, friendship, notification; bibliotheque timestamps';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE bibliotheque ADD created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
        $this->addSql('CREATE TABLE user_follow (id_follow INT AUTO_INCREMENT NOT NULL, created_at DATETIME NOT NULL, id_follower INT NOT NULL, id_following INT NOT NULL, INDEX IDX_FOLLOW_FOLLOWER (id_follower), INDEX IDX_FOLLOW_FOLLOWING (id_following), UNIQUE INDEX UNIQ_FOLLOW_PAIR (id_follower, id_following), PRIMARY KEY (id_follow)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE friendship (id_friendship INT AUTO_INCREMENT NOT NULL, user_low_id INT NOT NULL, user_high_id INT NOT NULL, status VARCHAR(16) NOT NULL, created_at DATETIME NOT NULL, accepted_at DATETIME DEFAULT NULL, id_requester INT NOT NULL, id_addressee INT NOT NULL, INDEX IDX_FRIEND_REQUESTER (id_requester), INDEX IDX_FRIEND_ADDRESSEE (id_addressee), UNIQUE INDEX UNIQ_FRIENDSHIP_PAIR (user_low_id, user_high_id), PRIMARY KEY (id_friendship)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE notification (id_notification INT AUTO_INCREMENT NOT NULL, type VARCHAR(32) NOT NULL, payload JSON NOT NULL, read_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, id_utilisateur INT NOT NULL, INDEX IDX_NOTIF_USER (id_utilisateur), INDEX IDX_NOTIF_USER_READ (id_utilisateur, read_at), PRIMARY KEY (id_notification)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE user_follow ADD CONSTRAINT FK_USER_FOLLOW_FOLLOWER FOREIGN KEY (id_follower) REFERENCES utilisateur (id_utilisateur) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE user_follow ADD CONSTRAINT FK_USER_FOLLOW_FOLLOWING FOREIGN KEY (id_following) REFERENCES utilisateur (id_utilisateur) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE friendship ADD CONSTRAINT FK_FRIEND_REQUESTER FOREIGN KEY (id_requester) REFERENCES utilisateur (id_utilisateur) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE friendship ADD CONSTRAINT FK_FRIEND_ADDRESSEE FOREIGN KEY (id_addressee) REFERENCES utilisateur (id_utilisateur) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT FK_NOTIF_USER FOREIGN KEY (id_utilisateur) REFERENCES utilisateur (id_utilisateur) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE notification DROP FOREIGN KEY FK_NOTIF_USER');
        $this->addSql('ALTER TABLE friendship DROP FOREIGN KEY FK_FRIEND_ADDRESSEE');
        $this->addSql('ALTER TABLE friendship DROP FOREIGN KEY FK_FRIEND_REQUESTER');
        $this->addSql('ALTER TABLE user_follow DROP FOREIGN KEY FK_USER_FOLLOW_FOLLOWING');
        $this->addSql('ALTER TABLE user_follow DROP FOREIGN KEY FK_USER_FOLLOW_FOLLOWER');
        $this->addSql('DROP TABLE notification');
        $this->addSql('DROP TABLE friendship');
        $this->addSql('DROP TABLE user_follow');
        $this->addSql('ALTER TABLE bibliotheque DROP created_at, DROP updated_at');
    }
}
