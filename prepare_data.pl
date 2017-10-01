#!/usr/bin/perl -CSA

use Modern::Perl qw(2015);
use autodie;
use utf8;

use DateTime::Format::ISO8601;
use JSON::XS;
use Path::Tiny;
use XML::Simple;

use Data::Printer;

sub from_xml {
	return XMLin(shift, ForceArray => 1, KeyAttr => [], KeepRoot => 1);
}

sub to_json {
	state $json = JSON::XS->new->canonical(1);
	$json->encode(shift);
}

sub main {
	my ($photos_xml, @tracks_gpx) = @_;

	my @all_locations;
	my @tracks = map { prepare_track($_, \@all_locations) } @tracks_gpx;
	my @photos = prepare_photos($photos_xml);

	@all_locations = sort { $a->{timestamp} <=> $b->{timestamp} } @all_locations;
	@photos = sort { $a->{timestamp} <=> $b->{timestamp} } @photos;
	fix_photo_locations(\@photos, \@all_locations);

	my $output = {
		tracks => \@tracks,
		photos => \@photos,
	};

	print to_json($output);
}

# GPX from Strava
sub prepare_track {
	my ($filename, $all_locations) = @_;

	my $xml = from_xml(path($filename)->slurp_utf8);
	my $trk = $xml->{gpx}->[0]->{trk}->[0];
	my $name = $trk->{name}->[0];
	my $link = $trk->{link}->[0]->{href};
	my $color = $name =~ /spaní/ ? '#0000ff' : '#ff0000';
	my @trkpts = map { @{$_->{trkpt}} } @{$trk->{trkseg}};
	my @coords = map +{
		lat => 1 * $_->{lat},
		lon => 1 * $_->{lon},
		timestamp => iso8601_to_timestamp($_->{time}->[0]),
	}, @trkpts;
	push @$all_locations, @coords;

	{
		name => $name,
		color => $color,
		coords => [ map +[ $_->{lat}, $_->{lon} ], @coords ],
		link => $link,
	};
}

sub iso8601_to_timestamp {
	DateTime::Format::ISO8601->parse_datetime(shift)->epoch;
}

# In browser that's logged in to Google:
# - create new tmp album
# - https://picasaweb.google.com/data/feed/api/user/113411333440293111262
# - find album
# - https://picasaweb.google.com/data/feed/api/user/113411333440293111262/albumid/6471621605834696945
# - save as photos.xml
sub prepare_photos {
	my $filename = shift;

	my $xml = from_xml(path($filename)->slurp_utf8);
	map { prepare_photo($_) } @{$xml->{feed}->[0]->{entry}};
}

sub prepare_photo {
	my $entry = shift;

	my @thumbnails = map { @{$_->{'media:thumbnail'}} } @{$entry->{'media:group'}};
	my ($thumbnail) = map { $_->{url} } grep { $_->{width} == 72 or $_->{height} == 72 } @thumbnails;
	my ($preview) = map { $_->{url} } grep { $_->{width} == 288 or $_->{height} == 288 } @thumbnails;
	my $url = $preview =~ s|/s288/|/s0/|r;
	my ($lat, $lon) = split(' ', $entry->{'georss:where'}->[0]->{'gml:Point'}->[0]->{'gml:pos'}->[0] // '');

	{
		timestamp => $entry->{'gphoto:timestamp'}->[0] / 1000,
		thumbnail => $thumbnail,
		preview => $preview,
		url => $url,
		lat => $lat,
		lon => $lon,
	};
}

sub fix_photo_locations {
	my ($photos, $all_locations) = @_;

	my $current_location = shift @$all_locations;
	for my $photo (@$photos) {
		while ($current_location->{timestamp} < $photo->{timestamp} and @$all_locations) {
			$current_location = shift @$all_locations;
		}

		@$photo{'lat', 'lon'} = @$current_location{'lat', 'lon'};
	}
}

main(@ARGV);
