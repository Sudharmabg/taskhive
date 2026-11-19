package com.taskhive.taskhive_backend.service;

import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Decides which Epics, Tasks and Bugs a user may see.
 *
 * Admins see everything. Everyone else sees:
 *  - stories that belong to their team,
 *  - stories they created or are assigned to (even in another team), and
 *  - stories with no team yet (created before teams were tracked on stories)
 *    when someone in their team is assigned.
 */
@Service
@RequiredArgsConstructor
public class StoryAccessService {

    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;

    /** Stories from the list the current user may see, in the original order. */
    public List<Story> visible(List<Story> stories) {
        User user = currentUserService.get().orElse(null);
        if (CurrentUserService.isAdmin(user)) return stories;
        if (user == null) return List.of();
        Set<String> teammates = teammateNames(user);
        return stories.stream().filter(s -> canView(user, s, teammates)).toList();
    }

    public boolean canView(Story story) {
        User user = currentUserService.get().orElse(null);
        if (CurrentUserService.isAdmin(user)) return true;
        return user != null && canView(user, story, teammateNames(user));
    }

    private static boolean canView(User user, Story story, Set<String> teammates) {
        if (story == null) return false;
        if (story.getTeamId() != null && story.getTeamId().equals(user.getTeamId())) return true;
        if (Objects.equals(story.getCreatedBy(), user.getId())) return true;
        if (CurrentUserService.isAssignee(user, story.getAssigneeName())) return true;
        if (story.getTeamId() == null && story.getAssigneeName() != null && !teammates.isEmpty()) {
            return Arrays.stream(story.getAssigneeName().split(","))
                .map(n -> n.trim().toLowerCase(Locale.ROOT))
                .anyMatch(teammates::contains);
        }
        return false;
    }

    /** Lower-case names of everyone in the user's team (empty when the user has no team). */
    private Set<String> teammateNames(User user) {
        if (user.getTeamId() == null) return Set.of();
        Set<String> names = new HashSet<>();
        for (User member : userRepository.findByTeamId(user.getTeamId())) {
            if (member.getName() != null) names.add(member.getName().trim().toLowerCase(Locale.ROOT));
        }
        return names;
    }
}
