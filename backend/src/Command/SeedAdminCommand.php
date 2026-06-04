<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(name: 'app:seed-admin', description: 'Crée un compte administrateur si absent')]
final class SeedAdminCommand extends Command
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $email = 'admin@letterbook.local';

        $existing = $this->userRepository->findOneBy(['email' => $email]);
        if ($existing instanceof User) {
            $io->warning('Le compte administrateur existe déjà : '.$email);

            return Command::SUCCESS;
        }

        $user = new User();
        $user->setEmail($email);
        $user->setPseudo('admin');
        $user->setPassword($this->passwordHasher->hashPassword($user, 'AdminLetterBook!2026'));
        $user->setRoles(['ROLE_ADMIN']);
        $user->setConsentementRgpd(true);
        $user->setConsentementRgpdAt(new \DateTimeImmutable());

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $io->success('Administrateur créé : '.$email.' / AdminLetterBook!2026');

        return Command::SUCCESS;
    }
}
