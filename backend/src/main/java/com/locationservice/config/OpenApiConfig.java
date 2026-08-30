package com.locationservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Drei Location Service API")
                        .version("v1")
                        .description("Manage geographic locations with a 100 m PREMIUM-uniqueness rule and bounding-box search.")
                        .contact(new Contact().name("Sample App")));
    }
}
