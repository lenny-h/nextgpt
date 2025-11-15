output "artifact_registry_url" {
  value       = "${var.google_vertex_location}-docker.pkg.dev/${var.google_vertex_project}/app-artifact-repository"
  description = "Artifact Registry repository URL"
}
