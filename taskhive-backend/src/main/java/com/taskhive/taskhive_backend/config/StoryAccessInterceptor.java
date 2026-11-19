package com.taskhive.taskhive_backend.config;

import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.repository.AttachmentRepository;
import com.taskhive.taskhive_backend.repository.StoryRepository;
import com.taskhive.taskhive_backend.repository.SubtaskRepository;
import com.taskhive.taskhive_backend.repository.TimeLogRepository;
import com.taskhive.taskhive_backend.service.StoryAccessService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Blocks every per-story endpoint (the story itself, its subtasks, attachments, time logs and
 * history) when the story belongs to a team the caller can't see. Answers "not found" so other
 * teams' work isn't revealed. Lists are filtered separately by {@link StoryAccessService#visible}.
 */
@Component
@RequiredArgsConstructor
public class StoryAccessInterceptor implements HandlerInterceptor {

    private static final Pattern STORY = Pattern.compile("^/api/stories/(\\d+)(/.*)?$");
    private static final Pattern STORY_KEY = Pattern.compile("^/api/stories/story/([^/]+)$");
    private static final Pattern SUBTASK = Pattern.compile("^/api/subtasks/(\\d+)(/.*)?$");
    private static final Pattern ATTACHMENT = Pattern.compile("^/api/attachments/(\\d+)(/.*)?$");
    private static final Pattern TIME_LOG = Pattern.compile("^/api/timelogs/(\\d+)(/.*)?$");

    private final StoryAccessService storyAccessService;
    private final StoryRepository storyRepository;
    private final SubtaskRepository subtaskRepository;
    private final AttachmentRepository attachmentRepository;
    private final TimeLogRepository timeLogRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        String path = request.getRequestURI().substring(request.getContextPath().length());

        Optional<Story> story = resolve(path);
        if (story == null || story.isEmpty()) return true; // not a per-story path, or nothing to protect
        if (storyAccessService.canView(story.get())) return true;

        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"success\":false,\"message\":\"Story not found\"}");
        return false;
    }

    /** The story a path refers to; null when the path isn't per-story. */
    private Optional<Story> resolve(String path) {
        Matcher m;
        if ((m = STORY_KEY.matcher(path)).matches()) {
            return storyRepository.findByStoryId(m.group(1));
        }
        if ((m = STORY.matcher(path)).matches()) {
            return storyRepository.findById(Long.parseLong(m.group(1)));
        }
        if ((m = SUBTASK.matcher(path)).matches()) {
            return subtaskRepository.findById(Long.parseLong(m.group(1)))
                .flatMap(s -> storyRepository.findById(s.getStoryId()));
        }
        if ((m = ATTACHMENT.matcher(path)).matches()) {
            return attachmentRepository.findStoryIdById(Long.parseLong(m.group(1)))
                .flatMap(storyRepository::findById);
        }
        if ((m = TIME_LOG.matcher(path)).matches()) {
            return timeLogRepository.findById(Long.parseLong(m.group(1)))
                .flatMap(t -> storyRepository.findById(t.getStoryId()));
        }
        return null;
    }
}
