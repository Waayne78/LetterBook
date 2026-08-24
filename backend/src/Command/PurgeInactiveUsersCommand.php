<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\AccountDeletionService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:purge-inactive-users',
    description: 'Supprime les comptes inactifs depuis plus de 12 mois (RGPD).',
)]
final class PurgeInactiveUsersCommand extends Command
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly AccountDeletionService $accountDeletionService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('dry-run', null, InputOption::VALUE_NONE, 'Affiche les comptes concernés sans les supprimer');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = (bool) $input->getOption('dry-run');
        $cutoff = new \DateTimeImmutable('-12 months');
        $users = $this->userRepository->findInactiveSince($cutoff);

        if ([] === $users) {
            $io->success('Aucun compte inactif à purger.');

            return Command::SUCCESS;
        }

        $io->writeln(sprintf('%d compte(s) inactif(s) depuis avant %s.', \count($users), $cutoff->format('Y-m-d')));

        foreach ($users as $user) {
            if (!$user instanceof User) {
                continue;
            }
            if ($dryRun) {
                $io->writeln(sprintf('- [%d] %s (%s)', $user->getId(), $user->getPseudo(), $user->getEmail()));
                continue;
            }
            $this->accountDeletionService->deleteAccount($user);
            $io->writeln(sprintf('Supprimé : %s', $user->getEmail()));
        }

        $io->success($dryRun ? 'Simulation terminée.' : 'Purge terminée.');

        return Command::SUCCESS;
    }
}
