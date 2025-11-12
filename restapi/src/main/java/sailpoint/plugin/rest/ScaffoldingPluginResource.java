package sailpoint.plugin.rest;

import java.util.HashMap;
import java.util.Map;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import sailpoint.api.SailPointContext;
import sailpoint.api.SailPointFactory;
import sailpoint.object.Identity;
import sailpoint.rest.plugin.BasePluginResource;
import sailpoint.rest.plugin.RequiresRight;
import sailpoint.tools.GeneralException;
import sailpoint.tools.Util;

/**
 * REST API Resource for the Scaffolding Plugin.
 * Provides endpoints for retrieving identity information.
 *
 * @author SailPoint
 * @version 1.1.0
 */
@Path("scaffolding")
@Produces(MediaType.APPLICATION_JSON)
@Consumes({ MediaType.APPLICATION_JSON, MediaType.WILDCARD })
public class ScaffoldingPluginResource extends BasePluginResource {

    private static final Logger logger = LoggerFactory.getLogger(ScaffoldingPluginResource.class);

    // Maximum length for identity name to prevent abuse
    private static final int MAX_IDENTITY_NAME_LENGTH = 128;

    @Override
    public String getPluginName() {
        return "ScaffoldingPlugin";
    }

    /**
     * Retrieves identity information by identity name.
     * Requires ViewIdentity right for security.
     *
     * @param identityName The name of the identity to retrieve
     * @return Response containing identity information or error message
     */
    @GET
    @Path("info/{name}")
    @RequiresRight(value = "ViewIdentity")
    public Response getInfo(@PathParam("name") String identityName) {
        SailPointContext context = null;

        try {
            // Input validation
            if (Util.isNullOrEmpty(identityName)) {
                logger.warn("Identity name is null or empty");
                return buildErrorResponse(
                    Response.Status.BAD_REQUEST,
                    "Identity name is required"
                );
            }

            // Trim whitespace
            identityName = identityName.trim();

            // Validate length
            if (identityName.length() > MAX_IDENTITY_NAME_LENGTH) {
                logger.warn("Identity name too long: {} characters", identityName.length());
                return buildErrorResponse(
                    Response.Status.BAD_REQUEST,
                    "Identity name exceeds maximum length of " + MAX_IDENTITY_NAME_LENGTH
                );
            }

            // Sanitize input - only allow alphanumeric, dots, hyphens, underscores, and @ symbol
            if (!identityName.matches("^[a-zA-Z0-9._@-]+$")) {
                logger.warn("Identity name contains invalid characters: {}", sanitizeForLogging(identityName));
                return buildErrorResponse(
                    Response.Status.BAD_REQUEST,
                    "Identity name contains invalid characters"
                );
            }

            if (logger.isDebugEnabled()) {
                logger.debug("Fetching identity info for: {}", sanitizeForLogging(identityName));
            }

            // Get SailPoint context
            context = SailPointFactory.getCurrentContext();
            if (context == null) {
                logger.error("Unable to obtain SailPointContext");
                return buildErrorResponse(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    "Internal server error"
                );
            }

            // Retrieve identity
            Identity identity = context.getObject(Identity.class, identityName);

            if (identity == null) {
                logger.info("Identity not found: {}", sanitizeForLogging(identityName));
                return buildErrorResponse(
                    Response.Status.NOT_FOUND,
                    "Identity not found"
                );
            }

            // Build response DTO
            Map<String, Object> identityModel = new HashMap<>();
            identityModel.put("name", identity.getName());
            identityModel.put("id", identity.getId());
            identityModel.put("email", identity.getEmail());

            if (logger.isDebugEnabled()) {
                logger.debug("Successfully retrieved identity: {}", identity.getName());
            }

            return Response.ok(identityModel).build();

        } catch (GeneralException e) {
            logger.error("Error retrieving identity information for: {}",
                sanitizeForLogging(identityName), e);
            return buildErrorResponse(
                Response.Status.INTERNAL_SERVER_ERROR,
                "An error occurred while retrieving identity information"
            );
        } catch (Exception e) {
            logger.error("Unexpected error retrieving identity information for: {}",
                sanitizeForLogging(identityName), e);
            return buildErrorResponse(
                Response.Status.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred"
            );
        } finally {
            // Always release context to prevent resource leaks
            if (context != null) {
                try {
                    SailPointFactory.releaseContext(context);
                } catch (GeneralException e) {
                    logger.error("Error releasing SailPointContext", e);
                }
            }
        }
    }

    /**
     * Builds a standardized error response.
     *
     * @param status HTTP status code
     * @param message Error message
     * @return Response with error details
     */
    private Response buildErrorResponse(Response.Status status, String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", status.getReasonPhrase());
        error.put("message", message);
        error.put("status", status.getStatusCode());
        error.put("timestamp", System.currentTimeMillis());

        return Response.status(status).entity(error).build();
    }

    /**
     * Sanitizes input for safe logging to prevent log injection attacks.
     *
     * @param input The input to sanitize
     * @return Sanitized string safe for logging
     */
    private String sanitizeForLogging(String input) {
        if (input == null) {
            return "null";
        }
        // Remove newlines and carriage returns to prevent log injection
        return input.replaceAll("[\r\n]", "_");
    }
}
