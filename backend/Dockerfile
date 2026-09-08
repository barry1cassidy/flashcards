FROM eclipse-temurin:21-jdk-noble AS build
WORKDIR /src
COPY mvnw pom.xml ./
COPY .mvn .mvn
COPY src src
RUN chmod +x mvnw && ./mvnw -q -DskipTests package

FROM eclipse-temurin:21-jre-noble
WORKDIR /app
RUN useradd --system --create-home --uid 10001 app
COPY --from=build /src/target/backend-0.0.1-SNAPSHOT.jar app.jar
USER app
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=50 -XX:+UseContainerSupport"
ENTRYPOINT ["java", "-jar", "app.jar"]

FROM eclipse-temurin:21-jre-noble
WORKDIR /app
RUN useradd --system --create-home --uid 10001 app
COPY --from=build /src/target/backend-0.0.1-SNAPSHOT.jar app.jar
USER app
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=50 -XX:+UseContainerSupport"
ENTRYPOINT ["java", "-jar", "app.jar"]
