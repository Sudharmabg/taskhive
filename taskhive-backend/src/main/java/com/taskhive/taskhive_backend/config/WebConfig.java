package com.taskhive.taskhive_backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final StoryAccessInterceptor storyAccessInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(storyAccessInterceptor)
            .addPathPatterns("/api/stories/**", "/api/subtasks/**", "/api/attachments/**", "/api/timelogs/**");
    }
}
